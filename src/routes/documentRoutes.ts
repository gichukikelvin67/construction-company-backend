import{Router}from "express";

import{
    createDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    archiveDocument,
    restoreDocument,
}from "../controllers/documentController.js";

import { protect} from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
     createDocumentSchema,
     updateDocumentSchema,

 } from "../validators/documentValidators.js";

 const router=Router();
 //create document

 router.post("/",
    protect,
    allowRoles(
        "admin",
        "project_manager",
        "site_supevisor",
        "accountant",
        "storekeeper"
    ),
    validate(createDocumentSchema),
    createDocument
 );
 //Get all documents
 router.get("/",
    protect,
    allowRoles(
        "admin",
        "project_manager",
        "site_supervisor",
        "accountant",
        "storekeeper"
    ),
    getDocuments
 )
 router.get(
    "/:id",
    protect,
    allowRoles(
        "admin",
        "project_manager",
        "site_supervisor",
        "accountant",
        "storekeeper"
    ),
    getDocumentById
 );
 router.patch(
  "/:id",
  protect,
  allowRoles(
    "admin",
    "project_manager",
    "site_supervisor",
    "accountant",
    "storekeeper"
  ),
  validate(updateDocumentSchema),
  updateDocument
);
 router.patch(
    "/:id/archive",
    protect,
    allowRoles("admin","project_manager"),
    archiveDocument
 );

 router.patch("/:id/restore",
    protect,
    allowRoles("admin"),
    restoreDocument
 );
 export default router;