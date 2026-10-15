"""Decode the existing 25fps demo clips into actual frames for pose inference."""
import argparse, pathlib, shutil, subprocess
parser=argparse.ArgumentParser()
parser.add_argument('--ffmpeg',default=shutil.which('ffmpeg'))
args=parser.parse_args()
if not args.ffmpeg:parser.error('Supply --ffmpeg with the path to FFmpeg')
root=pathlib.Path(__file__).resolve().parent.parent
for index in range(1,10):
    camera=f'cam{index:02d}'
    output=root/'.pose-frames'/camera
    output.mkdir(parents=True,exist_ok=True)
    subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(root/'media'/(camera+'.mp4')),'-vf',r'select=not(mod(n\,3))','-fps_mode','vfr','-q:v','2',str(output/'frame-%04d.jpg')],check=True)
    print(camera,'decoded',len(list(output.glob('*.jpg'))),'frames',flush=True)
