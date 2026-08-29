#!/bin/bash
# Script untuk reset credentials di docker container MCSP di VPS
# 
# Cara penggunaan:
# 1. SSH ke VPS: ssh root@187.77.116.9
# 2. cd ke folder project: cd /path/to/mcsp-project
# 3. Jalankan: bash reset-vps-credentials.sh

CONTAINER_NAME="mcsp-kpk-rbs-kk-2026"
DB_NAME="mcsp_konawe"
DB_USER="postgres"

echo "=================================="
echo "Reset MCSP Credentials di VPS"
echo "=================================="
echo ""

# Check container
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ ERROR: Container $CONTAINER_NAME tidak running!"
    echo "Jalankan: docker-compose up -d"
    exit 1
fi

echo "✅ Container $CONTAINER_NAME sudah running"
echo ""

# Step 1: Create SQL update script yang akan dijalankan
echo "[1/2] Generating password hashes..."

# Buat Node.js script untuk generate hash
HASH_SCRIPT=$(mktemp)
cat > "$HASH_SCRIPT" << 'NODESCRIPT'
const bcrypt = require('bcryptjs');

async function main() {
  const users = [
    { email: 'admin.mcsp@konawekab.go.id', password: 'admin123@' },
    { email: 'admin.bkpsdm@konawekab.go.id', password: 'AdminBKPSDM@2026!' },
    { email: 'admin.bpkad@konawekab.go.id', password: 'AdminBPKAD@2026!' },
    { email: 'admin.dinaspupr@konawekab.go.id', password: 'AdminDinasPUPR@2026!' }
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`UPDATE "users" SET password = '${hash}' WHERE email = '${user.email}';`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
NODESCRIPT

# Run script di container dan tangkap output SQL
SQL_COMMANDS=$(docker exec -i $CONTAINER_NAME node $HASH_SCRIPT 2>/dev/null)
HASH_EXIT=$?

rm -f "$HASH_SCRIPT"

if [ $HASH_EXIT -ne 0 ]; then
    echo "❌ ERROR: Gagal generate password hashes!"
    exit 1
fi

echo "✅ Password hashes generated"
echo ""
echo "[2/2] Updating database..."

echo "$SQL_COMMANDS" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Update berhasil!"
    echo ""
    echo "=================================="
    echo "Credential Baru (mandatory)"
    echo "=================================="
    echo ""
    echo "📌 ADMIN_UTAMA:"
    echo "   Email: admin.mcsp@konawekab.go.id"
    echo "   Password: admin123@"
    echo ""
    echo "📌 ADMIN_OPD BKPSDM:"
    echo "   Email: admin.bkpsdm@konawekab.go.id"
    echo "   Password: AdminBKPSDM@2026!"
    echo ""
    echo "📌 ADMIN_OPD BPKAD:"
    echo "   Email: admin.bpkad@konawekab.go.id"
    echo "   Password: AdminBPKAD@2026!"
    echo ""
    echo "📌 ADMIN_OPD Dinas PUPR:"
    echo "   Email: admin.dinaspupr@konawekab.go.id"
    echo "   Password: AdminDinasPUPR@2026!"
    echo ""
    echo "=================================="
else
    echo "❌ ERROR: Gagal update database!"
    exit 1
fi
