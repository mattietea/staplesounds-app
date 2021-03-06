import {Genres} from "./genres";
export class Song {
    constructor(public title?: string,
                public artist?: string,
                public audio?: string,
                public image?: string,
                public download?: string,
                public id?: string,
                public url?: string,
                public created?: any,
                public genres?: Genres,
                public rank?: number,
                public author?: string
    ) {
        this.genres = new Genres();
    }
}
