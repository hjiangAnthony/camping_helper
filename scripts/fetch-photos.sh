#!/usr/bin/env bash
set -euo pipefail

mkdir -p assets/photos

fetch_photo() {
  local file="$1"
  local url="$2"
  echo "Fetching $file"
  curl --location --fail --silent --show-error --retry 3 --output "assets/photos/$file" "$url"
}

fetch_photo "june-lake.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Stunning%20June%20Lake%20in%20the%20Fall.jpg?width=960"
fetch_photo "gull-lake.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Gull%20Lake%20Mammoth%20September%202016%20panorama.jpg?width=960"
fetch_photo "silver-lake.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Silver%20Lake%20California%20On%20A%20Fall%20Afternoon%20%2853015906%29.jpeg?width=960"
fetch_photo "grant-lake.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mount%20Wood%20from%20Grant%20Lake.jpg?width=960"
fetch_photo "twin-lakes.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fall%20Reflection%20on%20Twin%20Lakes%2C%20CA%209-16%20%2831236262975%29.jpg?width=960"
fetch_photo "lake-mary.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lake%20Mary%20Mammoth%20September%202016.jpg?width=960"
fetch_photo "lake-george.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Fall%20Morning%20on%20Lake%20George%2C%20Mammoth%20Lakes%2C%20CA%209-16%20%2830989839440%29.jpg?width=960"
fetch_photo "tenaya-lake.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tenaya%20Lake%20120%C2%B0%20pano.jpg?width=960"
fetch_photo "olmsted-point.jpg" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Olmsted%20Point%20overlooking%20the%20Half%20Dome%2C%20Yosemite%2C%20California%20-%20panoramio.jpg?width=960"
