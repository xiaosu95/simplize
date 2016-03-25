var utils = require('../utils');
var headbar = require('./headbar');
var browser = require('../application/browser');
var webview = require('../application/webviews');
var HeadBar = require('../application/headbar');

module.exports = function(name, options, toolbar){
    var result = {};
    var data = { status: false, __transition: options.transition || '' };
    var webviewCreater = webview.create(options.webviews || {});
    var mode = options.keepAlive ? 'v-show="status"' : 'v-if="status"';
    var ignores = ['name', 'template', 'components', 'props', 'computed', 'keepAlive', 'methods', 'events', 'watch', 'data', 'webviews', 'headbar', 'transition'];

    toolbar.fix(options, data);
    result.name = 'browser';

    /**
     *  browser template maker
     */
    result.template =
        '<div class="web-browser" ' + mode + ' :transition="__transition | fixAnimation">' +
            '<headbar v-ref:headbar></headbar>' +
            '<div class="web-views">' + webviewCreater.html + '</div>' +
        '</div>';

    /**
     *  browser component maker
     */
    result.components = options.components || {};
    var HeadbarComponent = options.headbar || headbar.component();
    HeadbarComponent = HeadBar(HeadbarComponent);
    result.components.headbar = HeadbarComponent;
    utils.$extend(result.components, webviewCreater.result);

    /**
     * extend computed objects
     */
    result.computed = options.computed || {};
    var computeds = {
        req: {
            set: function(value){ this.$root.req = value; },
            get: function(){ return this.$root.req; }
        },
        env: {
            set: function(value){ this.$root.env = value; },
            get: function(){ return this.$root.env; }
        },
        $toolbar: function(){
            return this.$root.$toolbar;
        }
    }
    if ( options.keepAlive ){
        computeds.$headbar = function(){
            return this.$refs.headbar;
        }
    }
    utils.$extend(result.computed, computeds);

    /**
     * extend method objects
     */
    result.methods = options.methods || {};
    var methods = {
        $webview: webview.get,
        $run: browser.run,
        $use: browser.use,
        $active: browser.active,
        $render: browser.render,
        $route: browser.route,
        $redirect: browser.redirect
    }
    utils.$extend(result.methods, methods);

    /**
     * extend event objects
     */
    options.events = options.events || {};
    var _end = options.events.end;
    if ( typeof _end === 'function' ) delete options.events.end
    result.events = options.events;
    var events = {
        end: function(){
            this.$nextcb && this.$nextcb();
            typeof _end === 'function' && _end.call(this);
        }
    }
    utils.$extend(result.events, events);

    /**
     * extend watch objects
     */
    result.watch = options.watch || {};
    var watches = {
        "status": function(value){
            var that = this;
            var app = this.$parent;
            if ( value ){
                app.ActiveBrowser = this;
                this.$emit('active');
                if ( options.keepAlive ){
                    utils.nextTick(function(){
                        that.$headbar.$emit('size');
                    })
                }
            }else{
                this.$emit('unactive');
                var webview = this.$ActiveWebview;
                if ( webview ){
                    webview.status = false;
                }
            }
        }
    }
    utils.$extend(result.watch, watches);

    /**
     *  extend data objects
     */
    utils.$extend(data, options.data || {});
    result.data = function(){ return data; }

    result.created = function(){
        this.$isBrowser = true;
    }

    for ( var opt in options ){
        if ( ignores.indexOf(opt) == -1 ){
            result[opt] = options[opt];
        }
    }

    return result;
}
