import {Arg, Ctx, Int, Mutation, Query, Resolver} from "type-graphql"
import {Repository} from "typeorm";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Context} from "./types/Context";
import {GraphQLUpload, Upload} from "graphql-upload";
import {Media} from "../entity/Media";
import {generate} from "shortid";
import * as fs from "fs";

interface FileInsert {
    newName: string,
    path: string
}

@Resolver(Media)
export class MediaResolver {
    private static uploadDir: string = './img';

    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>
    ) {
    }

    private static storeFile(stream, filename): Promise<FileInsert> {
        const id = generate();
        const newName = `${id}-${filename}`;
        const path = `${MediaResolver.uploadDir}/${newName}`;
        return new Promise(((resolve, reject) =>
                stream.on('error', err => {
                    if (stream.truncated) fs.unlinkSync(path);
                    reject(err);
                }).pipe(fs.createWriteStream(path))
                    .on('error', err => reject(err))
                    .on('finish', () => resolve({path: path, newName: newName}))
        ))
    }

    private static deleteFile(filename) {
        const path = `${MediaResolver.uploadDir}/${filename}`;
        return new Promise(((resolve, reject) => {
            fs.stat(path, (err, stats) => {
                if (err) {
                    console.log(err)
                    reject(err)
                } else {
                    fs.unlink(path, (err) => {
                        if (err) {
                            console.log(err)
                            reject(err)
                        } else {
                            resolve();
                        }
                    });
                }
            });
        }))
    }

    @Query(returns => [Media])
    async myMedia(@Ctx() {user}): Promise<Media[]> {
        return this.mediaRepository.find({where: {uploader: user}})
    }

    @Mutation(returns => Media)
    async upload(@Arg('file', type => GraphQLUpload) file: Upload,
                 @Arg('width', type => Int!) width: number,
                 @Arg('height', type => Int!) height: number,
                 @Ctx() {user}: Context): Promise<Media> {
        const {stream, filename, mimetype, encoding} = await file;
        console.log(`Receiving file filename: ${filename},
         mimetype: ${mimetype},
          encoding: ${encoding},
           height: ${height},
            width: ${width}`);
        const {path, newName} = await MediaResolver.storeFile(stream, filename);
        const media = this.mediaRepository.create({
            filename: newName,
            mimetype: mimetype,
            encoding: encoding,
            path: path,
            uploader: user,
            width: width,
            height: height
        });
        return this.mediaRepository.save(media);
    }

    @Mutation(returns => Media)
    async delete(@Arg('mediaId', type => Int!) mediaId: number,
                 @Ctx() {user}: Context): Promise<Media> {
        const medium = await this.mediaRepository.findOne(mediaId);
        await MediaResolver.deleteFile(medium.filename).catch((err) => {
            console.log(err);
            return Promise.reject("Internal Server Error")
        });
        return this.mediaRepository.remove(medium);
    }
}