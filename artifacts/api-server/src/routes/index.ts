import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import weeksRouter from "./weeks";
import adminRouter from "./admin";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(weeksRouter);
router.use(adminRouter);
router.use(settingsRouter);

export default router;
