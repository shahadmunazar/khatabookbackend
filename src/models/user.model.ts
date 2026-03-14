import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, BelongsToMany, HasMany, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Role } from './role.model';
import { UserRole } from './user-role.model';
@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model {
  @BelongsToMany(() => Role, () => UserRole)
  declare roles: Role[];

  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
  })
  name: string;

  @Column({
    type: DataType.STRING(255),
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING(20),
    unique: true,
  })
  phone: string;

  @Column({
    type: DataType.STRING(255),
  })
  password: string;

  @Column({
    field: 'user_type',
    type: DataType.ENUM('individual', 'company'),
    allowNull: false,
    defaultValue: 'individual',
  })
  declare userType: string;

  @ForeignKey(() => User)
  @Column({
    field: 'company_id',
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare companyId: number;

  @BelongsTo(() => User, 'company_id')
  declare company: User;

  @HasMany(() => User, 'company_id')
  declare employees: User[];

  @Column({
    field: 'is_verified',
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isVerified: boolean;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  declare otp: string | null;

  @Column({
    field: 'otp_expiry',
    type: DataType.DATE,
    allowNull: true,
  })
  declare otpExpiry: Date | null;

  @Column({
    field: 'verification_token',
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare verificationToken: string | null;

  @CreatedAt
  @Column({
    field: 'created_at',
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
    type: DataType.DATE,
  })
  declare updatedAt: Date;
}
