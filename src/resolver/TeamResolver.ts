import {Arg, Ctx, Int, Mutation, Query, registerEnumType, Resolver} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {User} from "../entity/user/User";
import {Like, Repository} from "typeorm";
import {Media} from "../entity/Media";
import {Membership} from "../entity/social/Membership";
import {Team} from "../entity/social/Team";
import {Context} from "./types/Context";
import {TeamInput} from "./types/TeamInput";
import {publish} from "../util/EventUtil";

export enum TeamResolverErrors {
    ERR_MEMBERSHIP_ALREADY_EXISTS = "ERR_MEMBERSHIP_ALREADY_EXISTS",
    ERR_MEDIA_UNASSIGNABLE_TO_AVATAR = "ERR_MEDIA_UNASSIGNABLE_TO_AVATAR",
    ERR_TEAMNAME_DUPLCATE = "ERR_TEAMNAME_DUPLCATE",
    ERR_TEAMNAME_INVALID = "ERR_TEAMNAME_INVALID",
    ERR_TEAM_DOES_NOT_EXIST = "ERR_TEAM_DOES_NOT_EXIST",
    ERR_NOT_TEAM_MEMBER = "ERR_NOT_TEAM_MEMBER",
    ERR_NO_TEAM_AUTHORITY = "ERR_NO_TEAM_AUTHORITY",
    ERR_USER_DOES_NOT_EXIST = "ERR_USER_DOES_NOT_EXIST",
}

registerEnumType(TeamResolverErrors, {
    name: 'TeamResolverErrors',
    description: 'Error conditions raised by TeamResolver.js'
});

@Resolver()
export class TeamResolver {

    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
        @InjectRepository(Membership) private readonly memberRepository: Repository<Membership>
    ) {
    }

    private async _joinTeam(user: User, team: Team): Promise<Membership> {
        const currentMemberships = (await team.members).filter(m => m.isAccepted === true);
        const currentMembers = await Promise.all(await currentMemberships.map(async m => {
            return (await m.user).id
        }));
        if (currentMembers.some(id => id === user.id)) {
            return Promise.reject(TeamResolverErrors.ERR_MEMBERSHIP_ALREADY_EXISTS)
        }
        /*  if(AsyncSome(currentMembers, async m => {
              return (await m.user).id === user.id
          })) {
          } */
        let newMembership = new Membership();
        newMembership.user = Promise.resolve(user);
        newMembership.team = Promise.resolve(team);
        return this.memberRepository.save(newMembership);
    }

    private async _confirm(memberShip: Membership): Promise<Membership> {
        memberShip.isActive = true;
        memberShip.activationDate = new Date(Date.now());
        publish(memberShip, "confirm", true);
        return this.memberRepository.save(memberShip);
    }

    private async _modUser(memberShip: Membership): Promise<Membership> {
        memberShip.isAdmin = true;
        return this.memberRepository.save(memberShip);
    }

    private async _unmodUser(memberShip: Membership): Promise<Membership> {
        memberShip.isAdmin = false;
        return this.memberRepository.save(memberShip);
    }

    private async _setTeamAvatar(mediaId: number, team: Team): Promise<Team> {
        const media = await this.mediaRepository.findOne(mediaId);
        if (media) {
            team.avatar = Promise.resolve(media);
            return this.teamRepository.save(team);
        } else return Promise.reject(TeamResolverErrors.ERR_MEDIA_UNASSIGNABLE_TO_AVATAR);
    }

    private async _membershipsContain(memberships: Membership[], teamId): Promise<Team> {
        const teams = await Promise.all(memberships.map(async (membership) => {
            return await membership.team;
        }));
        return teams.find((team) => team.id === teamId)

    }

    private async _hasTeamAuthority(user: User, team: Team): Promise<Boolean> {
        console.log(user, team,  await this._getTeamMembership(user, team.id));
        return (await this._getTeamMembership(user, team.id)).isAdmin;
    }

    private async _getTeamMembership(user: User, teamId: number): Promise<Membership> {
        const team = await this._membershipsContain(await user.memberships, teamId);
        if (team) {
            const teamMemberships = await team.members;
            const filteredMemberships = await Promise.all(teamMemberships.map(async (m) => {
                const currentMembershipUser = await m.user;
                return currentMembershipUser.id === user.id ? m : null;
            }));
            return filteredMemberships.filter((val) => val !== null)[0];
        }
        return null;
    }

    @Mutation(returns => Team)
    async createTeam(@Arg('team', type => TeamInput) teamInput: TeamInput,
                     @Ctx() {user}: Context): Promise<Team> {

        const conflict = await this.teamRepository.findOne({where: {name: teamInput.teamName}});
        if (conflict) return Promise.reject(TeamResolverErrors.ERR_TEAMNAME_DUPLCATE);
        let newTeam = new Team();

        //TODO replace with name validator
        if (!teamInput.teamName) {
            return Promise.reject(TeamResolverErrors.ERR_TEAMNAME_INVALID)
        }

        newTeam.name = teamInput.teamName;
        newTeam.description = teamInput.teamDescription || null;
        newTeam.closed = teamInput.closed || false;

        let team = await this.teamRepository.save(newTeam);

        if (teamInput.mediaId) team = await this._setTeamAvatar(teamInput.mediaId, team);
        let membership = await this._joinTeam(user, team);
        membership = await this._confirm(membership);
        membership = await this._modUser(membership);

        return this.teamRepository.findOne(team.id);
    }

    @Mutation(returns => Team)
    async updateTeam(@Arg('team', type => TeamInput) teamInput: TeamInput,
                     @Ctx() {user}: Context): Promise<Team> {

        let team = await this.teamRepository.findOne(teamInput.id);
        if (!team) return Promise.reject(TeamResolverErrors.ERR_TEAM_DOES_NOT_EXIST);
        if (!await this._hasTeamAuthority(user, team)) return Promise.reject(TeamResolverErrors.ERR_NO_TEAM_AUTHORITY);

        team.name = teamInput.teamName || team.name;
        team.description = teamInput.teamDescription || team.description;
        team.closed = teamInput.closed || false;

        if (teamInput.mediaId) team = await this._setTeamAvatar(teamInput.mediaId, team);

        team = await this.teamRepository.save(team).catch((err) => {
            console.error(err);
            return Promise.reject(TeamResolverErrors.ERR_TEAM_DOES_NOT_EXIST)
        });

        return this.teamRepository.findOne(team.id);
    }


    @Query(returns => Team)
    async getMyTeam(@Arg("teamId", type => Int) teamId: number, @Ctx() {user}: Context): Promise<Team> {
        const memberships = await user.memberships;
        const selectedTeams = await this._membershipsContain(memberships, teamId).catch((err) => {
                console.error(err);
                return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER)
            }
        );
        if (!selectedTeams) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);
        return selectedTeams
    }

    @Query(returns => Team)
    async getTeam(@Arg("teamId", type => Int) teamId: number, @Ctx() {user}: Context): Promise<Team> {
        return this.teamRepository.findOne(teamId); //TODO blank fields based on closed status
    }

    @Query(returns => [Membership])
    async myMemberships(@Ctx() {user}: Context): Promise<Membership[]> {
        return user.memberships;
    }

    @Mutation(returns => Membership)
    async requestJoinTeam(@Arg("teamId", type => Int) teamId: number, @Ctx() {user}: Context): Promise<Membership> {
        const team = await this.teamRepository.findOne(teamId);
        return team ? this._joinTeam(user, team) : Promise.reject(TeamResolverErrors.ERR_TEAM_DOES_NOT_EXIST)
    }

    @Mutation(returns => Membership)
    async confirmMember(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if (!membership) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);
        if (await this._hasTeamAuthority(user, await membership.team)) {
            return this._confirm(membership)
        } else {
            return Promise.reject(TeamResolverErrors.ERR_NO_TEAM_AUTHORITY);
        }
    }


    @Mutation(returns => Membership)
    async acceptInvite(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {

        const membership = await this.memberRepository.findOne(membershipId);
        if (!membership) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);


        let targetUser = await membership.user;
        if (targetUser.id !== user.id) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER)

        membership.isAccepted = true;
        membership.isActive = true;

        return this.memberRepository.save(membership)
    }


    @Mutation(returns => Membership)
    async rejectInvite(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {

        const membership = await this.memberRepository.findOne(membershipId);
        if (!membership) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);
        if (membership.isAccepted) return Promise.reject(TeamResolverErrors.ERR_MEMBERSHIP_ALREADY_EXISTS);

        let targetUser = await membership.user;
        if (targetUser.id !== user.id) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER)

        return this.memberRepository.delete(membership.id)
    }


    @Mutation(returns => Membership)
    async modMember(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if (!membership) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);
        if (await this._hasTeamAuthority(user, await membership.team)) {
            return this._modUser(membership)
        } else {
            return Promise.reject(TeamResolverErrors.ERR_NO_TEAM_AUTHORITY);
        }
    }

    @Mutation(returns => Membership)
    async unmodMember(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if (!membership) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);
        if (await this._hasTeamAuthority(user, await membership.team)) {
            return this._unmodUser(membership)
        } else {
            return Promise.reject(TeamResolverErrors.ERR_NO_TEAM_AUTHORITY);
        }
    }

    @Mutation(returns => Membership)
    async leaveTeam(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if (!membership) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);
        if ((await membership.user).id === user.id) {
            return await this.deleteMembership(membership);
        } else {
            return Promise.reject(TeamResolverErrors.ERR_NO_TEAM_AUTHORITY);
        }
    }

    @Mutation(returns => Membership)
    async delMember(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if (!membership) return Promise.reject(TeamResolverErrors.ERR_NOT_TEAM_MEMBER);
        if (await this._hasTeamAuthority(user, await membership.team)) {
            return await this.deleteMembership(membership);
        } else {
            return Promise.reject(TeamResolverErrors.ERR_NO_TEAM_AUTHORITY);
        }
    }

    private async deleteMembership(membership: Membership) {
        const deletedMembership = await this.memberRepository.remove(membership);
        publish(deletedMembership, "remove", true);
        const team = await deletedMembership.team;
        const members = await (team).members;
        if (members.length === 0) {
            this.teamRepository.remove(team).then(res => console.log(`Deleted ${team}: no memebers left!`));
        }
        return deletedMembership;
    }

//todo use a real search provider for this -- edit 2020-03-02 nah, it's good
    @Query(returns => [Team])
    async searchTeamsByName(@Arg("teamName", type => String) teamName: String): Promise<Team[]> {
        return this.teamRepository.find({where: {name: Like(`%${teamName}%`)}})
    }

    @Mutation(returns => Membership)
    async inviteUserToTeam(@Arg("screenName", type => String) screenName: String, @Arg("teamId", type => Int) teamId: number): Promise<Membership> {
        const user = await this.userRepository.findOne({where:
                [{screenName: screenName}, {userName: screenName}]});
        const team = await this.teamRepository.findOne(teamId);
        if (!user) {
            return Promise.reject(TeamResolverErrors.ERR_USER_DOES_NOT_EXIST);
        }
        if (!team) {
            return Promise.reject(TeamResolverErrors.ERR_TEAM_DOES_NOT_EXIST);
        }
        let invite = await this._joinTeam(user, team)

        invite.isAccepted = false;
        invite = await this.memberRepository.save(invite);
        return invite;
    }


}