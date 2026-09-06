#!/bin/zsh
set -u

local_url="http://127.0.0.1:3010/admin/pipeline"
hub_url="https://www.vegan-masala.com/admin/social"
log_file="/tmp/vegan-masala-admin.log"

if ! /usr/bin/curl -fsS --max-time 2 "$local_url" >/dev/null 2>&1; then
  /bin/launchctl kickstart -k "gui/$(/usr/bin/id -u)/com.veganmasala.admin"

  for attempt in {1..45}; do
    if /usr/bin/curl -fsS --max-time 2 "$local_url" >/dev/null 2>&1; then
      break
    fi
    /bin/sleep 1
  done
fi

if /usr/bin/curl -fsS --max-time 2 "$local_url" >/dev/null 2>&1; then
  /usr/bin/open "$hub_url"
  exit 0
fi

/usr/bin/open -a TextEdit "$log_file"
exit 1
