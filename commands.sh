ffmpeg -i bm-dark-forest-demo-triangle-1.mov -acodec copy  bm-dark-forest-demo-triangle-1.mp4
ffmpeg -i bm-preoder.mov -acodec aac -b:a 256k bm-preoder-ba.mp4
ffmpeg -r:v 15 -i %04d-export.tga -codec:v libx264 -preset veryslow -pix_fmt yuv420p -crf 28 -an ../exp.mp4
