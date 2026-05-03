import { Router, type IRouter } from "express";
import healthRouter from "./health";
import signalsRouter from "./signals";
import tradesRouter from "./trades";
import dashboardRouter from "./dashboard";
import marketRouter from "./market";

const router: IRouter = Router();

router.use(healthRouter);
router.use(signalsRouter);
router.use(tradesRouter);
router.use(dashboardRouter);
router.use(marketRouter);

export default router;
