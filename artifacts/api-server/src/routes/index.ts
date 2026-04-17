import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentSkillExchangeRouter from "./student-skill-exchange";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentSkillExchangeRouter);

export default router;
