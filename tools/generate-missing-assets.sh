#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

background() {
  out="$1" top="$2" bottom="$3" glow="$4"
  mkdir -p "$(dirname "$out")"
  convert -size 480x960 "gradient:${top}-${bottom}" \
    -fill "$glow" -stroke none \
    -draw 'circle 90,180 90,40 circle 390,530 390,360 circle 220,820 220,710' \
    -fill 'rgba(255,255,255,0.65)' \
    -draw 'circle 55,95 57,97 circle 420,145 422,147 circle 130,330 132,332 circle 345,710 347,712 circle 80,870 82,872 circle 286,430 288,432' \
    -quality 74 "$out"
}

boss() {
  out="$1" body="$2" plate="$3" core="$4" variant="$5"
  mkdir -p "$(dirname "$out")"
  case "$variant" in
    1) shape='polygon 256,58 438,205 397,381 314,338 256,456 198,338 115,381 74,205' ;;
    2) shape='polygon 256,48 465,235 405,420 320,350 256,462 192,350 107,420 47,235' ;;
    3) shape='polygon 256,76 420,120 474,330 342,299 256,444 170,299 38,330 92,120' ;;
    4) shape='polygon 256,42 375,156 456,256 375,356 256,470 137,356 56,256 137,156' ;;
    5) shape='polygon 256,58 330,168 462,218 382,326 407,443 256,382 105,443 130,326 50,218 182,168' ;;
    6) shape='polygon 256,38 356,145 466,198 418,340 306,318 256,474 206,318 94,340 46,198 156,145' ;;
    *) shape='polygon 256,30 342,128 474,184 423,330 337,326 256,480 175,326 89,330 38,184 170,128' ;;
  esac
  convert -size 512x512 xc:none -fill "$body" -stroke "$plate" -strokewidth 12 -draw "$shape" \
    -fill "$plate" -stroke none -draw 'polygon 110,232 230,190 201,322 92,350 polygon 402,232 282,190 311,322 420,350' \
    -fill "$core" -stroke white -strokewidth 6 -draw 'circle 256,244 256,184' \
    -fill white -stroke none -draw 'circle 256,244 256,222' -quality 88 "$out"
}

enemy() {
  out="$1" body="$2" accent="$3" variant="$4"
  mkdir -p "$(dirname "$out")"
  case "$variant" in
    shooter) shape='polygon 128,20 208,50 236,128 208,206 128,236 48,206 20,128 48,50' ;;
    splitter) shape='polygon 128,12 236,128 172,244 128,190 84,244 20,128' ;;
    splitter_mini) shape='polygon 128,20 224,128 128,236 32,128' ;;
    *) shape='polygon 128,12 168,78 244,128 168,178 128,244 88,178 12,128 88,78' ;;
  esac
  convert -size 256x256 xc:none -fill "$body" -stroke "$accent" -strokewidth 8 -draw "$shape" \
    -fill "$accent" -stroke none -draw 'circle 128,128 128,91' -fill white -draw 'circle 128,128 128,114' \
    -quality 88 "$out"
}

background "$root/assets/phases/phase2/vanguarda-background.webp" '#07101d' '#000207' 'rgba(90,160,210,0.10)'
background "$root/assets/phases/phase3/veu-carmesim-background.webp" '#250512' '#030006' 'rgba(255,25,100,0.11)'
background "$root/assets/phases/phase4/coracao-nebulosa-background.webp" '#26052d' '#030006' 'rgba(230,50,255,0.11)'
background "$root/assets/phases/phase5/cinturao-background.webp" '#251a0d' '#030201' 'rgba(255,170,50,0.09)'
background "$root/assets/phases/phase6/detritos-background.webp" '#251006' '#030201' 'rgba(255,95,30,0.10)'
background "$root/assets/phases/phase7/geleira-background.webp" '#062038' '#01050a' 'rgba(80,230,255,0.10)'
background "$root/assets/phases/phase8/fenda-background.webp" '#14223a' '#01030a' 'rgba(210,250,255,0.10)'
background "$root/assets/phases/phase9/portal-background.webp" '#261104' '#030100' 'rgba(255,150,30,0.11)'
background "$root/assets/phases/phase10/nucleo-final-background.webp" '#2c0303' '#030000' 'rgba(255,35,10,0.12)'

boss "$root/assets/phases/phase4/pulsar-magenta.webp" '#280038' '#cc35ff' '#ff8cff' 1
boss "$root/assets/phases/phase5/britador.webp" '#342719' '#d29438' '#ffd15a' 2
boss "$root/assets/phases/phase6/colisor.webp" '#351309' '#ff7428' '#fff07a' 3
boss "$root/assets/phases/phase7/glacius.webp" '#082842' '#58d9ff' '#d9ffff' 4
boss "$root/assets/phases/phase8/cristal-prime.webp" '#172744' '#d9f8ff' '#ffffff' 5
boss "$root/assets/phases/phase9/guardiao-nucleo.webp" '#361205' '#ff8c20' '#fff052' 6
boss "$root/assets/phases/phase10/imperador-abissal.webp" '#330004' '#ff321c' '#ffd34f' 7

enemy "$root/assets/enemies/shared/artilheiro-violeta.webp" '#4c096b' '#d348ff' shooter
enemy "$root/assets/enemies/shared/divisor-esmeralda.webp" '#064837' '#30ffc4' splitter
enemy "$root/assets/enemies/shared/fragmento-esmeralda.webp" '#075a46' '#74ffe0' splitter_mini
enemy "$root/assets/enemies/shared/rotor-ciano.webp" '#07395c' '#3fe5ff' spinner
