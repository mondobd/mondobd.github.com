require.config({
  "shim": {
    "jquery_mousewheel": ['jquery'],
    "jquery_flexslider": ['jquery', 'jquery_mousewheel'],
    "jquery_cycle_lite": ['jquery'],
    "jquery_colorbox": ['jquery'],
    "bootstrap_tooltip": ['jquery'],
    "app": ['d3', 'bootstrap_tooltip', 'jquery_mousewheel', 'jquery_flexslider', 'jquery_cycle_lite', 'jquery_colorbox', 'underscore', 'markdown']
  },

  "paths": {
    "hm": 'vendor/hm',
    "esprima": 'vendor/esprima',
    "jquery": 'vendor/jquery.min',
    "jquery_mousewheel": 'vendor/jquery.mousewheel',
    "jquery_flexslider": 'vendor/jquery.flexslider',
    "jquery_cycle_lite": 'vendor/jquery.cycle.lite',
    "jquery_colorbox": 'vendor/jquery.colorbox-min',
    "underscore": 'vendor/underscore.min',
    "markdown": 'vendor/markdown-js',
    "bootstrap_tooltip": 'vendor/bootstrap/bootstrap-tooltip',
    "d3": 'vendor/d3.v3.min'
  },
  

});
 
require([
'jquery',
'd3',
'app'
], function(app) {
  // use app here
  console.log(app);
});
