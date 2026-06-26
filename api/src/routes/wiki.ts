import { Router } from 'express';
import {
  createWikiPage,
  listWikiPages,
  getWikiPage,
  updateWikiPage,
  deleteWikiPage,
  addAlias,
  removeAlias,
  getLinks,
  createLink,
  removeLink,
  lookupWikis,
  getWikiReferences,
} from '../controllers/wikiController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  createWikiPageRequest,
  updateWikiPageRequest,
  getWikiPageRequest,
  listWikiPagesRequest,
  createWikiAliasRequest,
  deleteWikiAliasRequest,
  createWikiLinkRequest,
  deleteWikiLinkRequest,
} from '../utils/validation';

const router = Router();

// Public: list, detail, and lookup (for popover)
router.get('/', validateRequest(listWikiPagesRequest), listWikiPages);
router.get('/lookup', lookupWikis);
router.get('/:id', validateRequest(getWikiPageRequest), getWikiPage);

// Authenticated: CRUD
router.post('/', authenticate, validateRequest(createWikiPageRequest), createWikiPage);
router.put('/:id', authenticate, validateRequest(updateWikiPageRequest), updateWikiPage);
router.delete('/:id', authenticate, deleteWikiPage);

// Aliases
router.post('/:id/aliases', authenticate, validateRequest(createWikiAliasRequest), addAlias);
router.delete('/:id/aliases/:aliasId', authenticate, validateRequest(deleteWikiAliasRequest), removeAlias);

// Cross-references
router.get('/:id/references', getWikiReferences);

// Links
router.get('/:id/links', getLinks);
router.post('/:id/links', authenticate, validateRequest(createWikiLinkRequest), createLink);
router.delete('/:id/links/:linkId', authenticate, validateRequest(deleteWikiLinkRequest), removeLink);

export default router;
