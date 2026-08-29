#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")"

echo "=============================================="
echo "  RESET DATABASE MCSP KPK - KONAWE 2026"
echo "=============================================="
echo
echo "PERINGATAN: container dan volume database MCSP akan dihapus permanen."
echo "Semua data seed, akun, master data, submission, dan audit log ikut terhapus."
echo
read -r -p "Ketik RESET untuk melanjutkan: " confirmation
if [[ "$confirmation" != "RESET" ]]; then
  echo "Reset dibatalkan."
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker tidak ditemukan."
  exit 1
fi

if [[ ! -f docker-compose.yml ]]; then
  echo "ERROR: jalankan script dari proyek yang memiliki docker-compose.yml."
  exit 1
fi

echo
echo "Menghapus container, database, dan volume PostgreSQL MCSP..."
docker compose down -v --remove-orphans

echo
echo "CONTAINER DAN DATABASE SERVER MCSP BERHASIL DIHAPUS."
echo "Data seed tidak dibuat ulang."