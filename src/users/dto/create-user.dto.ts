import { User } from '../user.entity';

export class CreateUserDto implements Pick<User, 'firstName' | 'lastName'> {
  firstName: string;
  lastName: string;
}
