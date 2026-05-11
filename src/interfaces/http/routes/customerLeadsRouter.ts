/**
 * Interface Layer — CustomerLeadController
 *
 * Translates HTTP requests → Use-case inputs → HTTP responses.
 *
 * Responsibilities (and ONLY these):
 *  - Parse / validate HTTP-layer concerns (done via middleware)
 *  - Call the correct use-case
 *  - Serialize the result to a consistent API envelope
 *  - Delegate all error handling to the global error handler via next()
 *
 * The controller knows nothing about Supabase, DB rows, or business rules.
 */

import type { Request, Response, NextFunction } from 'express';
import type { GetCustomerLeadsUseCase } from '../../../application/customer-leads/GetCustomerLeadsUseCase';
import type { GetCustomerLeadByIdUseCase } from '../../../application/customer-leads/GetCustomerLeadsByIdUseCase';
import { customerLeadMapper } from '../../../infrastructure/supabase/CustomerLeadMapper';
import { Router } from 'express';
import type {
  CustomerLeadFilters,
  PaginationOptions,
} from '../../../domain/customer-leads/ICustomerLeadRepository';

export function createCustomerLeadsRouter(controller: CustomerLeadController) {
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);

  return router;
}

export class CustomerLeadController {
  constructor(
    private readonly getLeadsUseCase: GetCustomerLeadsUseCase,
    private readonly getLeadByIdUseCase: GetCustomerLeadByIdUseCase,
  ) {}

  // GET /api/customer-leads
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: CustomerLeadFilters = res.locals['filters'];
      const pagination: PaginationOptions = res.locals['pagination'];

      const result = await this.getLeadsUseCase.execute({ filters, pagination });

      res.status(200).json({
        success: true,
        leads: result.data.map((row) => customerLeadMapper.toResponseDto(row)),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  // GET /api/customer-leads/:id
  getById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params; // now typed as string
      const lead = await this.getLeadByIdUseCase.execute({ id });
      res.status(200).json({
        success: true,
        lead: customerLeadMapper.toResponseDto(lead),
      });
    } catch (err) {
      next(err);
    }
  };
}
