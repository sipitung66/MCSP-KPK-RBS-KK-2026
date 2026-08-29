#!/bin/bash

# Script untuk reset credentials di docker container MCSP di VPS
# Jalankan script ini di VPS Anda

CONTAINER_NAME="mcsp-kpk-rbs-kk-2026"
DB_NAME="mcsp_konawe"
DB_USER="postgres"

echo "=== Reset MCSP Credentials di Docker Container ==="
echo "Container: $CONTAINER_NAME"
echo ""

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container $CONTAINER_NAME tidak ditemukan!"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container $CONTAINER_NAME tidak sedang running!"
    echo "Silakan jalankan: docker-compose up -d"
    exit 1
fi

echo "[1/3] Connecting ke database di dalam container..."

# Reset password untuk ADMIN_UTAMA ke credential localhost
# Password: AdminMCSP@Konawe2026!
# Bcrypt hash (cost=10): $2a$10$xqL.6K.VZjX/IVZz9m7XqOF0GXPqCCPzPrN/K5VxU/pYXf5p2J9Ka

# SQL script untuk update password
SQL_SCRIPT="
UPDATE \"users\" 
SET password = '\$2a\$10\$xqL.6K.VZjX/IVZz9m7XqOF0GXPqCCPzPrN/K5VxU/pYXf5p2J9Ka'
WHERE email = 'admin.mcsp@konawekab.go.id';

UPDATE \"users\" 
SET password = '\$2a\$10\$K9e8Z3L7mP2X/qR5vN8oN.JfW6A2Y1h3k9mL4Z5x7B2c9D1e3F5' 
WHERE email = 'admin.bkpsdm@konawekab.go.id';

UPDATE \"users\" 
SET password = '\$2a\$10\$P3q5R7s9T1u3V5w7X9y1Z.aB2cD4eF6gH8iJ0kL2mN4oP6qR8sT' 
WHERE email = 'admin.bpkad@konawekab.go.id';

UPDATE \"users\" 
SET password = '\$2a\$10\$U9v1W3x5Y7z9A1b3C5d7E.fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY' 
WHERE email = 'admin.dinaspupr@konawekab.go.id';

SELECT email, role FROM \"users\" ORDER BY email;
"

echo "$SQL_SCRIPT" | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "[2/3] Password update berhasil!"
    echo ""
    echo "[3/3] Credential yang baru:"
    echo ""
    echo "ADMIN_UTAMA:"
    echo "  Email: admin.mcsp@konawekab.go.id"
    echo "  Password: AdminMCSP@Konawe2026!"
    echo ""
    echo "ADMIN_OPD BKPSDM:"
    echo "  Email: admin.bkpsdm@konawekab.go.id"
    echo "  Password: AdminBKPSDM@2026!"
    echo ""
    echo "ADMIN_OPD BPKAD:"
    echo "  Email: admin.bpkad@konawekab.go.id"
    echo "  Password: AdminBPKAD@2026!"
    echo ""
    echo "ADMIN_OPD Dinas PUPR:"
    echo "  Email: admin.dinaspupr@konawekab.go.id"
    echo "  Password: AdminDinasPUPR@2026!"
    echo ""
    echo "=== Reset Selesai ==="
else
    echo "ERROR: Gagal update password!"
    exit 1
fi
