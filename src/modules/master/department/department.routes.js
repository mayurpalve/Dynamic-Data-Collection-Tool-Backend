import express from "express";
import { protect } from "../../../middlewares/auth.middleware.js";
import { hasPermission } from "../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../constants/permissions.js";
import { create, list, remove } from "./department.controller.js";

const router = express.Router();

router.post(
  "/",
  protect,
  hasPermission(PERMISSIONS.MASTER_MANAGE),
  create
);

//adds delete route here
router.delete(
  "/:id",
  protect,
  hasPermission(PERMISSIONS.MASTER_MANAGE),
  remove
);


router.get("/", protect, list);

export default router;
