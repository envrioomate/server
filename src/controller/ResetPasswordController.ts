import {Router,Request,Response} from "express";
import {join} from "path"
let router = Router();
router.get('/', (req: Request, res: Response) =>{
    return res.sendFile(join(__dirname+'../../../express/resetPassword.html'))
});

//Other static pages like EULA etc... moved to client

export {router as ResetPasswordController} ;