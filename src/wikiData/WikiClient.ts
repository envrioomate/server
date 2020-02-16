
///////////
////
//// TODO FIX THIS S#!T


import axios from "axios";
import {Badge} from "../entity/wiki-content/Badge";
import {Service} from "typedi";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Repository} from "typeorm";
import * as Nearley from "nearley";
import * as grammar from "./topicweekGrammar";
import {Props, WikiProps} from "../entity/wiki-content/Props";
import {Thema} from "../entity/wiki-content/Thema";
import {Kategorie} from "../entity/wiki-content/Kategorie";
import {Oberthema} from "../entity/wiki-content/Oberthema";
import {WikiImage} from "../entity/wiki-content/WikiImage";
import {WikiWarning, WikiWarnings} from "../entity/wiki-content/WikiWarning";
import {Quelle} from "../entity/wiki-content/Quelle";
import {Achievement} from "../entity/wiki-content/Achievement";

let config = require("../../config.json");

interface WikiPageData {
    wikiProps,
    templateData
}

@Service()
export class WikiClient {

    private static requestAllTopicsParamObject = {
        action: "query",
        format: "json",
        list: "categorymembers",
        cmtitle: "Kategorie%3AThema"
    };

    private parser = new Nearley.Parser(Nearley.Grammar.fromCompiled(grammar));

    private readonly clean;

    private connection = axios.create({
        baseURL: config.wikiUrl,
        timeout: 1000,
    });

    constructor(
        @InjectRepository(Badge) private readonly badgeRepository: Repository<Badge>,
        @InjectRepository(Kategorie) private readonly kategorieRepository: Repository<Kategorie>,
        @InjectRepository(Oberthema) private readonly oberthemaRepository: Repository<Oberthema>,
        @InjectRepository(Props) private readonly propsRepository: Repository<Props>,
        @InjectRepository(Quelle) private readonly quelleRepository: Repository<Quelle>,
        @InjectRepository(Thema) private readonly themaRepository: Repository<Thema>,
        @InjectRepository(Achievement) private readonly achievementRepository: Repository<Achievement>,
        @InjectRepository(WikiImage) private readonly wikiImageRepository: Repository<WikiImage>,
        @InjectRepository(WikiWarning) private readonly wikiWaringRepsitory: Repository<WikiWarning>,
    ) {
        this.clean = this.parser.save();
    }

    private static requestTemplatesForPages(pageIds: Number[]) {
        return {
            action: "query",
            format: "json",
            prop: "revisions|pageprops",
            pageids: encodeURIComponent(pageIds.join('|')),
            rvprop: "ids|timestamp|flags|comment|content|user|text"
        }
    }

    private static requestImagesForFile(canonicalFileName: string) {
        return {
            action: "query",
            format: "json",
            prop: "imageinfo|revisions",
            indexpageids: 1,
            titles: canonicalFileName,
            iiprop: "timestamp|user|url|mime",
            rvprop: "text"
        }
    }

    public paramObjectToUrl(params: Object): string {
        return "/api.php?" + Object.keys(params).map(key => {
            return `${key}=${params[key]}&`
        }).join('').slice(0, -1);
    }

    public async syncPage(pageId: number) {
        this.fetchPage(pageId)
            .then(async (data) => {
                this.savePage(data);
            })
            .catch(e => console.error(e))
    }

    public async syncAllPages() {
        const wikiData = await this.fetchAllPages();
        wikiData.forEach(async (val) => this.savePage(val))
    }

    public async fetchPage(pageId: number): Promise<WikiPageData> {
        let targetURL = this.paramObjectToUrl(WikiClient.requestTemplatesForPages([pageId]));
        console.log(targetURL);
        const wikiData = await this.connection.get(targetURL);
        return this.extractPage(pageId, wikiData);

    }

    public async fetchAllPages(): Promise<WikiPageData[]> {
        console.log(this.paramObjectToUrl(WikiClient.requestAllTopicsParamObject));
        const res = await this.connection.get(this.paramObjectToUrl(WikiClient.requestAllTopicsParamObject));
        const pages = res.data.query.categorymembers.map((val) => (val.title.slice(0, 8) !== "Vorlage:") ? val.pageid : null).filter((val) => val !== null);
        console.log(this.paramObjectToUrl(WikiClient.requestTemplatesForPages(pages)));
        const wikiData = await this.connection.get(this.paramObjectToUrl(WikiClient.requestTemplatesForPages(pages)));
        return pages.map((pageId) => {
            return this.extractPage(pageId, wikiData);
        });
    }

    extractPage(pageId: number, wikiData): WikiPageData {
        const pageData = wikiData.data.query.pages[pageId];
        const wikiProps: WikiProps = {
            pageid: pageData.pageid,
            revid: pageData.revisions[0].revid,
            parentid: pageData.revisions[0].parentid,
            user: pageData.revisions[0].user,
            timestamp: new Date(pageData.revisions[0].timestamp)
        };
        const templateData = this.parseWikiTemplates(wikiData.data.query.pages[pageId].revisions[0]['*']);

        return {wikiProps: wikiProps, templateData: templateData};
    }

    public async savePage(pageData: WikiPageData) {
        let props: Props = Props.create(pageData.wikiProps);

        props = await this.propsRepository.save(props);

        let dbWarnings = await this.wikiWaringRepsitory.find({props: {pageid: props.pageid}});
        await this.wikiWaringRepsitory.remove(dbWarnings)
            .catch(err => console.error("WikiClient Error: " + err.toString()));

        let warnings: WikiWarnings[] = [];
        try {
            if (!pageData.templateData) {
                throw new Error(warnings.toString())
            }

            let themaPromise = pageData.templateData.filter(t => t.templateName === "Thema").map(value => this.extractThema(value)).filter(Boolean)[0];
            let thema = await themaPromise.catch(err=> {console.log(err); return null});
            let badgePromises = (pageData.templateData.filter(t => t.templateName === "Badge").map(async value => await this.extractBadge(value)));
            let badges = await Promise.all(badgePromises).catch(err=> {console.log(err); return null});
            let achievements = pageData.templateData.map(value => this.extractAchievement(value)).filter(Boolean);


            await Promise.all(badges.map(b => b.achievements = achievements.filter(a => a.badgeName === b.name)));
            thema.badges = this.badgeRepository.save(badges);


            let themaResult = await this.themaRepository.save(thema);


        } catch (e) {
            console.error(e.message);
            warnings.push(WikiWarnings.TemplateParsingError);
        }
        if (warnings.length > 0) {
            let wikiWarning = WikiWarning.fromWarnings(warnings);
            wikiWarning.props = props;
            this.wikiWaringRepsitory.save(wikiWarning)
                .then(() => console.log(`Logged warnings on page ${props.pageid}!`))
                .catch(err => console.error("WikiClient Error: " + err.toString()));
        }

    }

    private async extractThema(template: any): Promise<Thema> {
        if(template.templateName === "Thema") {
            let {templateValues} = template;
            let thema = Thema.fromTemplate(templateValues);
            thema.headerImage = await this.fetchWikiImage(templateValues.headerImage, thema).catch(err=> {console.log(err); return null});;
            return thema;
        }
    }

    private async extractBadge(template: any): Promise<Badge> {
        if(template.templateName === "Badge") {
            let {templateValues} = template;
            let badge = Badge.fromTemplate(templateValues);
            badge.headerImage = await this.fetchWikiImage(templateValues.headerImage, badge).catch(err=> {console.log(err); return null});
            badge.icon = await this.fetchWikiImage(templateValues.badgeIcon, badge).catch(err=> {console.log(err); return null});
            return badge;
        }
    }

    private extractAchievement(template: any) {
        if(template.templateName === "Achievement") {
            return Achievement.fromTemplate(template.templateValues)
        }
    }


    private async fetchWikiImage(wikiImageUrl: string, assignee: (Badge | Thema)): Promise<WikiImage>  {
        if(wikiImageUrl){
            try {
                let imageInfo = await this.connection.get(this.paramObjectToUrl(WikiClient.requestImagesForFile(wikiImageUrl)));
                let headerImage = WikiImage.fromRequest(imageInfo);
                headerImage.props = Promise.resolve(assignee.props);
                console.log(headerImage.canonicalName, assignee.constructor.name);
                return this.wikiImageRepository.save(headerImage);
            } catch (e) {
                console.log(e.message);
                return Promise.reject("couldn't fetch")
            }
        } else {
            return Promise.reject("no image")
        }

    }

    private parseWikiTemplates(wikiText: string): [Object] {
        this.parser.restore(this.clean);
        try {
            this.parser.feed(wikiText);
            return this.parser.results[0];
        } catch (e) {
            console.error(e + `\nText:\n${wikiText}`);
            return null;
        }
    }

    public async  getAllPagesWithWarnings(): Promise<Props[]> {
        const pages = await this.propsRepository.find();
        return pages.filter((page) => page.warnings != undefined);
    }

    public async getProps(pageId: number): Promise<Props> {
        const props = await this.propsRepository.findOne(pageId);
        if(props)
            return props;
        else
            return undefined;
    }
}