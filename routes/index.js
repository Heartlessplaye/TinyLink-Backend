import { Router } from "express";
import {
  createTinyLink,
  getTinyLinkList,
  getSingleTinyLinkDetails,
  deleteTinyLink,
  redirectToOriginalUrl,
  healthCheck,
} from "../controllers/index.js";
const TinyLinkRouter = Router();

TinyLinkRouter.route("/links").post(createTinyLink).get(getTinyLinkList);
TinyLinkRouter.route("/links/:code")
  .get(getSingleTinyLinkDetails)
  .delete(deleteTinyLink);

TinyLinkRouter.route("/:code").get(redirectToOriginalUrl);
TinyLinkRouter.route("/:healthz").get(healthCheck);

export default TinyLinkRouter;
