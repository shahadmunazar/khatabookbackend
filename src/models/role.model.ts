import { Table, Column, Model, DataType, CreatedAt, BelongsToMany } from 'sequelize-typescript';
import { User } from './user.model';
import { UserRole } from './user-role.model';

@Table({
  tableName: 'roles',
  timestamps: false,
})
export class Role extends Model {
  @BelongsToMany(() => User, () => UserRole)
  declare users: User[];

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    unique: true,
  })
  name: string;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;
}
