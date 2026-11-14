#!/usr/bin/env bash
# Run ON the WordPress host (self-hosted worker /mnt/webdata/www @ mail.skoleudstyr.dk
# or SSH into that machine). Locates zac_delivery, installs diagnostics MU-plugin,
# and prints the confirmation call site. Does NOT bypass delivery validation.
set -euo pipefail

ROOT_CANDIDATES=(
  "${ZAC_WP_ROOT:-}"
  /home/Northstar/web/zebiza.com/public_html
  /mnt/webdata/www/zebiza.com
  /mnt/webdata/www/zebiza.com/public_html
)

ROOT=""
for c in "${ROOT_CANDIDATES[@]}"; do
  [[ -z "$c" ]] && continue
  if [[ -d "$c/wp-content/plugins" ]]; then
    ROOT="$c"
    break
  fi
done

if [[ -z "$ROOT" ]]; then
  echo "FATAL: WordPress root not found. Set ZAC_WP_ROOT or run on the webdata host." >&2
  echo "Checked: ${ROOT_CANDIDATES[*]}" >&2
  ls /mnt/webdata/www 2>/dev/null | head -40 || true
  exit 2
fi

echo "ROOT=$ROOT"
PLUG="$ROOT/wp-content/plugins"
MU="$ROOT/wp-content/mu-plugins"
mkdir -p "$MU"

echo "=== grep zac_delivery ==="
grep -RIn --include='*.php' 'zac_delivery\|Leveringen kan ikke bekræftes' \
  "$PLUG" "$MU" "$ROOT/wp-content/themes" 2>/dev/null | head -80 || true

echo "=== zac plugin tree (top) ==="
ls -la "$PLUG/zac" 2>/dev/null | head -40 || echo "(no plugins/zac)"
ls -la "$PLUG" 2>/dev/null | head -60 || true

# Install diagnostics MU-plugin from this repo when available next to the script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_MU="$SCRIPT_DIR/../wordpress/mu-plugins/zac-delivery-diagnostics.php"
if [[ -f "$REPO_MU" ]]; then
  cp -f "$REPO_MU" "$MU/zac-delivery-diagnostics.php"
  chown --reference="$ROOT/wp-config.php" "$MU/zac-delivery-diagnostics.php" 2>/dev/null || true
  echo "Installed MU-plugin: $MU/zac-delivery-diagnostics.php"
else
  echo "WARN: repo MU-plugin not found at $REPO_MU — skip copy"
fi

echo "=== hooks / confirm clients (heuristic) ==="
grep -RIn --include='*.php' \
  'woocommerce_store_api_checkout\|rest_pre_dispatch\|confirm.*deliver\|cj.*api\|ZAC_.*URL\|delivery_confirm' \
  "$PLUG/zac" "$PLUG/zebiza" "$MU" 2>/dev/null | head -80 || true

if command -v wp >/dev/null 2>&1; then
  echo "=== wp plugin list (custom) ==="
  sudo -u Northstar wp plugin list --path="$ROOT" --fields=name,status,version 2>/dev/null \
    | grep -Ei 'zac|zebiza|cj|deliver|reepay|frisbii' || true
  echo "=== recent woo logs (zac-delivery) ==="
  sudo -u Northstar wp wc tool list --path="$ROOT" 2>/dev/null | head -5 || true
  ls -lt "$ROOT/wp-content/uploads/wc-logs" 2>/dev/null | head -15 || true
fi

echo
echo "NEXT: open matching PHP, fix the real confirmation failure (credentials/endpoint/stock/address)."
echo "Do NOT remove the zac_delivery gate. Then run: scripts/reepay-checkout-e2e.py"
