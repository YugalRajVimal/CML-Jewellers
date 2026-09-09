#!/bin/bash
set -e

grep -rl '"\(dashboard\|products\|categories\|inventory\|purchases\|orders\|returns\|refunds\|customers\|coupons\|content\|admin_users\|roles\)\.\(view\|write\)"' src --include="*.ts" --include="*.tsx" | xargs sed -i '' \
  -e 's/"dashboard\.view"/"dashboard:read"/g' \
  -e 's/"products\.view"/"product:read"/g' \
  -e 's/"products\.write"/"product:write"/g' \
  -e 's/"categories\.view"/"category:write"/g' \
  -e 's/"categories\.write"/"category:write"/g' \
  -e 's/"inventory\.view"/"inventory:read"/g' \
  -e 's/"inventory\.write"/"inventory:write"/g' \
  -e 's/"purchases\.view"/"purchase:manage"/g' \
  -e 's/"purchases\.write"/"purchase:manage"/g' \
  -e 's/"orders\.view"/"order:read"/g' \
  -e 's/"orders\.write"/"order:write"/g' \
  -e 's/"returns\.view"/"return:manage"/g' \
  -e 's/"returns\.write"/"return:manage"/g' \
  -e 's/"refunds\.view"/"refund:manage"/g' \
  -e 's/"refunds\.write"/"refund:manage"/g' \
  -e 's/"customers\.view"/"customer:read"/g' \
  -e 's/"coupons\.view"/"coupon:manage"/g' \
  -e 's/"coupons\.write"/"coupon:manage"/g' \
  -e 's/"content\.view"/"content:manage"/g' \
  -e 's/"content\.write"/"content:manage"/g' \
  -e 's/"admin_users\.view"/"admin_user:manage"/g' \
  -e 's/"admin_users\.write"/"admin_user:manage"/g' \
  -e 's/"roles\.view"/"role:manage"/g' \
  -e 's/"roles\.write"/"role:manage"/g'

grep -rl '"sales\.view"' src --include="*.ts" --include="*.tsx" | xargs sed -i '' -e 's/"sales\.view"/"order:read"/g'

echo "Done."