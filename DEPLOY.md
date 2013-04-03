As of Yeoman pre-1.0, the Grunt task that should generate the
AppCache manifest does not actually work: therefore, after running
```yeoman build```, delete the ```data```, ```images```, ```scripts```
and ```styles``` folders, as well as ```index.html```, then copy over
fresh content from Yeoman's build output.

    rm -rf data images scripts styles index.html
    
    cp -a $BUILD_OUT/data $BUILD_OUT/images $BUILD_OUT/scripts $BUILD_OUT/styles $BUILD_OUT/index.html .
    
To update the AppCache manifest, replace all the content in the CACHE:
section with an updated file listing, e.g. by first appending this
to the existing manifest.appcache and then replacing the old section:

    find images/ data/ scripts/ styles/ -type f -or -type l | grep -v '\.scss$' >> manifest.appcache

and then edit the manifest.appcache file manually.

Finally, if the app is going to be loaded from filesystem (rather than
served via HTTP or HTTPS), on filesystem that don't support symlinks
(notably, Android's default filesystem, as well as Windows), all the
symlinks in the images/items folder need to be replaced with the
symlink's target:

    cd images
    
    tar -hcf - `find items -type l` | tar --overwrite -xf -
