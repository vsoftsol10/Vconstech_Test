# Manually applied password-field migration

`mustChangePassword BOOLEAN NOT NULL DEFAULT false` and `passwordExpiresAt TIMESTAMP(3)` were added manually. No SQL is included here, so deployment will not attempt to add them again.

After deploying this code, record the already-applied database change in Prisma's migration history (do not run `prisma migrate dev` or `prisma migrate deploy` for this change):

```powershell
cd Vconstech_backend
npx prisma migrate resolve --applied 20261012000000_add_user_password_change_fields
npx prisma generate
```

The included migration is deliberately comment-only. It must remain that way because the columns already exist.
