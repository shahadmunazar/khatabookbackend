import { Table, Column, Model, DataType, ForeignKey, CreatedAt } from 'sequelize-typescript';
import { User } from './user.model';
import { Role } from './role.model';

@Table({
  tableName: 'user_roles',
  timestamps: false,
})
export class UserRole extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    field: 'user_id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @ForeignKey(() => Role)
  @Column({
    field: 'role_id',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare roleId: number;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;
}
