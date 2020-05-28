import {Field, Int, ObjectType} from "type-graphql";


@ObjectType()
export class RemoteIcon {
    @Field(type => String)
    type: string = "remote";
    @Field(type => String)
    path: string;
}

@ObjectType()
export class PlayerLevel {
    @Field(type => Int)
    index: number;
    
    @Field(type => String)
    name: string;
    
    @Field(type => RemoteIcon)
    icon: RemoteIcon;

    @Field(type => Int)
    maxScore: number;


}

export const getCurrentLevel = (score) => {
    for (let l of LevelUpTable) {
        if (score < l.maxScore) {
            return l;
        }
    }
    return LevelUpTable[LevelUpTable.length - 1]
};


export const LevelUpTable: PlayerLevel[] =
    [
        {
            index: 0,
            name: "Ameise",
            icon: {
                type: "local",
                path: "assets/playerLevels/ant.png"
            },
            maxScore: 700
        },
        {
            index: 1,
            name: "Biene",
            icon: {
                type: "local",
                path: "assets/playerLevels/bee.png"
            },
            maxScore: 1400
        },
        {
            index: 2,
            name: "Schmetterling",
            icon: {
                type: "local",
                path: "assets/playerLevels/butterfly.png"
            },
            maxScore: 2100
        },
        {
            index: 3,
            name: "Heuschrecke",
            icon: {
                type: "local",
                path: "assets/playerLevels/cricket.png"
            },
            maxScore: 2800
        },
        {
            index: 4,
            name: "Libelle",
            icon: {
                type: "local",
                path: "assets/playerLevels/dragonfly.png"
            },
            maxScore: 3500
        },
        {
            index: 5,
            name: "Schecke",
            icon: {
                type: "local",
                path: "assets/playerLevels/snail.png"
            },
            maxScore: 4300
        },
        {
            index: 6,
            name: "Gecko",
            icon: {
                type: "local",
                path: "assets/playerLevels/gecko.png"
            },
            maxScore: 5100
        },
        {
            index: 7,
            name: "Maus",
            icon: {
                type: "local",
                path: "assets/playerLevels/mouse.png"
            },
            maxScore: 5900
        },
        {
            index: 8,
            name: "Kolibri",
            icon: {
                type: "local",
                path: "assets/playerLevels/hummingbird.png"
            },
            maxScore: 6700
        },
        {
            index: 9,
            name: "Seepferdchen",
            icon: {
                type: "local",
                path: "assets/playerLevels/seahorse.png"
            },
            maxScore: 8500
        },
        {
            index: 10,
            name: "Frosch",
            icon: {
                type: "local",
                path: "assets/playerLevels/frog.png"
            },
            maxScore: 9400
        },
        {
            index: 11,
            name: "Krebs",
            icon: {
                type: "local",
                path: "assets/playerLevels/crab.png"
            },
            maxScore: 10300
        },
        {
            index: 12,
            name: "Fledermaus",
            icon: {
                type: "local",
                path: "assets/playerLevels/bat.png"
            },
            maxScore: 11200
        },
        {
            index: 13,
            name: "Eichhörnchen",
            icon: {
                type: "local",
                path: "assets/playerLevels/squirrel.png"
            },
            maxScore: 12100
        },
        {
            index: 14,
            name: "Clownfisch",
            icon: {
                type: "local",
                path: "assets/playerLevels/clownfish.png"
            },
            maxScore: 13000
        },
        {
            index: 15,
            name: "Qualle",
            icon: {
                type: "local",
                path: "assets/playerLevels/jellyfish.png"
            },
            maxScore: 14000
        },
        {
            index: 16,
            name: "Igel",
            icon: {
                type: "local",
                path: "assets/playerLevels/hedgehog.png"
            },
            maxScore: 15000
        },
        {
            index: 17,
            name: "Tintenfisch",
            icon: {
                type: "local",
                path: "assets/playerLevels/squid.png"
            },
            maxScore: 16000
        },
        {
            index: 18,
            name: "Hase",
            icon: {
                type: "local",
                path: "assets/playerLevels/rabbit.png"
            },
            maxScore: 17000
        },
        {
            index: 19,
            name: "Falke",
            icon: {
                type: "local",
                path: "assets/playerLevels/egyptian-bird.png"
            },
            maxScore: 18000
        },
        {
            index: 20,
            name: "Katze",
            icon: {
                type: "local",
                path: "assets/playerLevels/cat.png"
            },
            maxScore: 19000
        },
        {
            index: 21,
            name: "Flamingo",
            icon: {
                type: "local",
                path: "assets/playerLevels/flamingo.png"
            },
            maxScore: 20000
        },
        {
            index: 22,
            name: "Pinguin",
            icon: {
                type: "local",
                path: "assets/playerLevels/penguin.png"
            },
            maxScore: 21000
        },
        {
            index: 23,
            name: "Koalabär",
            icon: {
                type: "local",
                path: "assets/playerLevels/koala.png"
            },
            maxScore: 22000
        },
        {
            index: 24,
            name: "Widder",
            icon: {
                type: "local",
                path: "assets/playerLevels/ram.png"
            },
            maxScore: 23000
        },
        {
            index: 25,
            name: "Kängeru",
            icon: {
                type: "local",
                path: "assets/playerLevels/kangaroo.png"
            },
            maxScore: 24000
        },
        {
            index: 26,
            name: "Delphin",
            icon: {
                type: "local",
                path: "assets/playerLevels/dolphin.png"
            },
            maxScore: 25000
        },
        {
            index: 27,
            name: "Gorilla",
            icon: {
                type: "local",
                path: "assets/playerLevels/gorilla.png"
            },
            maxScore: 26000
        },
        {
            index: 28,
            name: "Bär",
            icon: {
                type: "local",
                path: "assets/playerLevels/bear-facing-right.png"
            },
            maxScore: 27000
        },
        {
            index: 29,
            name: "Pferd",
            icon: {
                type: "local",
                path: "assets/playerLevels/wild-black-horse-lifting-front-foot.png"
            },
            maxScore: 28000
        },
        {
            index: 30,
            name: "Dromedar",
            icon: {
                type: "local",
                path: "assets/playerLevels/dromedary-facing-right.png"
            },
            maxScore: 29000
        },
        {
            index: 31,
            name: "Giraffe",
            icon: {
                type: "local",
                path: "assets/playerLevels/giraffe-facing-right.png"
            },
            maxScore: 30000
        },
        {
            index: 32,
            name: "Nilpferd",
            icon: {
                type: "local",
                path: "assets/playerLevels/hippopotamus-looking-right.png"
            },
            maxScore: 31000
        },
        {
            index: 33,
            name: "Nashorn",
            icon: {
                type: "local",
                path: "assets/playerLevels/rhinoceros-facing-right.png"
            },
            maxScore: 32000
        },
        {
            index: 34,
            name: "Elefant",
            icon: {
                type: "local",
                path: "assets/playerLevels/elephant.png"
            },
            maxScore: 33000
        },
        {
            index: 35,
            name: "Wal",
            icon: {
                type: "local",
                path: "assets/playerLevels/sperm-whale.png"
            },
            maxScore: 99999
        },
    ]
;

