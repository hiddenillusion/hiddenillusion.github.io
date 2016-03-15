// https://github.com/Gaohaoyang/gaohaoyang.github.io/blob/23646f08f58a24773ef0e62afd1d232f3e6a63eb/static/js/index.js

// labeling toc-content above {:toc} on a post should pick up the markdown TOC & build a list
function buildTOC() {
        //$('#toc-content').html('<ul>' + $('#markdown-toc').html() + '</ul>')
        $('#toc-content').html($('#markdown-toc').html())        
    };