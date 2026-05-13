#!/bin/bash
# Fetch city photos from Wikimedia Commons (1200px thumbnails).
# Uses curl with a proper User-Agent (Wikimedia rejects generic UAs).

set -e
PHOTO_DIR="$(dirname "$0")/../docs/assets/photos"
mkdir -p "$PHOTO_DIR"
UA="hudson-benchmark/0.2 (https://github.com/adamscavone/hudson-benchmark) curl"

# Format: dest_filename | thumbnail_url
# Thumbnail URL pattern: /commons/thumb/<a>/<ab>/<filename>/<width>px-<filename>
items=(
  "hudson-hero.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Clock_Tower_entrance_%28Hudson%2C_Ohio%29.jpg/1600px-Clock_Tower_entrance_%28Hudson%2C_Ohio%29.jpg"
  "hudson.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Hudson_Historic_District_section.jpg/1200px-Hudson_Historic_District_section.jpg"
  "solon.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/SolonCityHall.jpg/1000px-SolonCityHall.jpg"
  "aurora.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Church_and_town_hall_in_Aurora.jpg/1200px-Church_and_town_hall_in_Aurora.jpg"
  "bay-village.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Huntington_Beach_With_Downtown_Cleveland_In_Background.jpg/1200px-Huntington_Beach_With_Downtown_Cleveland_In_Background.jpg"
  "rocky-river.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Rocky_River_Ohio_aerial_view.jpg/1200px-Rocky_River_Ohio_aerial_view.jpg"
  "chagrin-falls.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Chagrin_Falls_Waterfall%2C_Ohio.jpg/1200px-Chagrin_Falls_Waterfall%2C_Ohio.jpg"
  "medina.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Uptown_Park%2C_Medina%2C_OH.jpg/1200px-Uptown_Park%2C_Medina%2C_OH.jpg"
  "ravenna.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Ravenna_downtown.jpg/1200px-Ravenna_downtown.jpg"
  "bexley.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Bexley_City_Hall_1.jpg/1200px-Bexley_City_Hall_1.jpg"
  "worthington.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Downtown_Worthington%2C_Ohio.jpg/1200px-Downtown_Worthington%2C_Ohio.jpg"
  "new-albany.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/New_Albany_City_Hall_1.jpg/1200px-New_Albany_City_Hall_1.jpg"
  "upper-arlington.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Aerial_view_of_Upper_Arlington%2C_September_2018.JPG/1200px-Aerial_view_of_Upper_Arlington%2C_September_2018.JPG"
  "montgomery.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Yost_Tavern_angle.jpg/1200px-Yost_Tavern_angle.jpg"
  "madeira.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Maderia_OH_USA.JPG/1200px-Maderia_OH_USA.JPG"
  "mariemont.jpg|https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Mariemont_Inn.jpg/1200px-Mariemont_Inn.jpg"
)

ok=0; fail=0
for item in "${items[@]}"; do
  dest="${item%%|*}"
  url="${item##*|}"
  printf "  %-22s ← " "$dest"
  if curl -L --fail --silent --show-error \
      -A "$UA" \
      -o "$PHOTO_DIR/$dest" \
      "$url"; then
    size=$(stat -c%s "$PHOTO_DIR/$dest" 2>/dev/null || stat -f%z "$PHOTO_DIR/$dest")
    printf "%5d KB  ✓\n" $((size / 1024))
    ok=$((ok + 1))
  else
    printf "FAIL\n"
    fail=$((fail + 1))
  fi
  sleep 0.3
done
echo ""
echo "Downloaded $ok / $((ok + fail)) photos."
ls -la "$PHOTO_DIR" | head -25
