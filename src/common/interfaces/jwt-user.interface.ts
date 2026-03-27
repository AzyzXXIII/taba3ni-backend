import { Role } from '../enums/role.enum';

/**
 * Shape of request.user after JwtStrategy.validate() runs.
 * Use this instead of `any` in controllers and decorators.
 */
export interface JwtUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}
