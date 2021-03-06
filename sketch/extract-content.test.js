(function() {
    var url = 'http://labs.orezdnu.org/js/extract-content/'; // for test
    var libs = [
        [ 'lib.js', [
            'ExtractContentJS.Lib.Util',
            'ExtractContentJS.Lib.A',
            'ExtractContentJS.Lib.DOM'
        ] ],
        [ 'extract-content.js', 'ExtractContentJS.LayeredExtractor' ]
    ];
    var testFunc = function(l) {
        var Util = ExtractContentJS.Lib.Util;
        var A = ExtractContentJS.Lib.A;
        var DOM = ExtractContentJS.Lib.DOM;

        if (typeof l.ExtractContentTest == 'undefined') {
            var ExtractContentTest = {};
        }
        var debug = l.ExtractContentTest.debug;

        l.ExtractContentTest.extractContent = function(d) {
            if (!d.body) return null;

            if (l.ExtractContentTest.only == 'Heuristics') {
                // test only Heuristics handler
                var ex = new WWW.LayeredExtractor.Handler.Heuristics();
                ex.extract(d);
                var blocks = ex.blocks || [ ex.content.asLeaves() ];
                var div = d.createElement('div');
                var ul = d.createElement('ul');
                A.forEach(blocks, function(b) {
                    var li = d.createElement('li');
                    li.appendChild(d.createTextNode(b.score));
                    var ul2 = d.createElement('ul');
                    A.forEach(b.leaves, function(v){
                        v = v.node;
                        var s = v.tagName || DOM.text(v) || Util.dump(v);
                        s = s.replace(/\s+/g, '');
                        var li2 = d.createElement('li');
                        s = v.nodeName + ': ' + (s.length ? s : '<empty>');
                        li2.appendChild(d.createTextNode(s));
                        ul2.appendChild(li2);
                    });
                    li.appendChild(ul2);
                    ul.appendChild(li);
                });
                div.appendChild(ul);
                return div;
            }

            /* TEST for layred handlers */

            var timer = new ExtractContentJS.Lib.Util.BenchmarkTimer();

            var ex = new ExtractContentJS.LayeredExtractor();
//             ex.addHandler( ex.factory.getHandler('Description') );
//             ex.addHandler( ex.factory.getHandler('Scraper'));
//             ex.addHandler( ex.factory.getHandler('GoogleAdSection') );
            ex.addHandler( ex.factory.getHandler('Heuristics') );
            timer.start('extract');
            var res = ex.extract(d);
            var time = timer.stop('extract').elapsed;

            if (!res.isSuccess) {
                return d.createTextNode('failed');
            }

            var div = d.createElement('div');
            var h1 = d.createElement('h1');
            h1.appendChild(d.createTextNode(res.engine.name));
            div.appendChild(h1);

            if (!debug) {
                if (l.ExtractContentTest.asText) {
                    var text = res.content.toString();
                    div.appendChild(d.createTextNode(text));
                } else if (l.ExtractContentTest.asTextFragment) {
                    var text = res.content.asTextFragment();
                    div.appendChild(d.createTextNode(text));
                } else {
                    var node = res.content.asNode();
                    if (node != d.body) {
                        div.appendChild(node.cloneNode(true));
                    }
                }
                return div;
            } else { // debug
                var blocks = res.engine.blocks || [ res.content.asLeaves() ];

                var pTimer = d.createElement('p');
                pTimer.appendChild(d.createTextNode(time+'msec'));
                div.appendChild(pTimer);

                var ul = d.createElement('ul');
                A.forEach(blocks, function(b) {
                    var li = d.createElement('li');
                    li.appendChild(d.createTextNode(b.score));
                    var ul2 = d.createElement('ul');
                    A.forEach(b.leaves, function(v){
                        v = v.node;
                        var s = v.tagName || DOM.text(v) || Util.dump(v);
                        s = s.replace(/\s+/g, '');
                        var li2 = d.createElement('li');
                        s = v.nodeName + ': ' + (s.length ? s : '<empty>');
                        li2.appendChild(d.createTextNode(s));
                        ul2.appendChild(li2);
                    });
                    li.appendChild(ul2);
                    ul.appendChild(li);
                });
                div.appendChild(ul);
            }

            return div;
        };

        l.ExtractContentTest.doTest = function() {
            var e = l.ExtractContentTest.extractContent(document);
            var b = document.body;
            while (b.firstChild) {
                b.removeChild(b.firstChild);
            }
            b.appendChild(e);
        };

        if (l.ExtractContentTest.auto) {
            l.ExtractContentTest.doTest();
        }
    };

    /* library loader */

    var A = {
        filter: Array.filter || function(self, fun/*, thisp*/) {
            var argi = 2;
            var len = self.length;
            if (typeof fun != "function") {
                throw new TypeError('A.filter: not a function');
            }
            var rv = new Array();
            var thisp = arguments[argi++];
            for (var i = 0; i < len; i++) {
                if (i in self) {
                    var val = self[i]; // in case fun mutates this
                    if (fun.call(thisp, val, i, self)) rv.push(val);
                }
            }
            return rv;
        },
        every: Array.every || function(self, fun/*, thisp*/) {
            var argi = 2;
            var len = self.length;
            if (typeof fun != 'function') {
                throw new TypeError('A.every: not a function');
            }
            var thisp = arguments[argi++];
            for (var i = 0; i < len; i++) {
                if (i in self &&
                    !fun.call(thisp, self[i], i, self)) {
                    return false;
                }
            }
            return true;
        },
        reduce: Array.reduce || function(self, fun/*, initial*/) {
            var argi = 2;
            var len = self.length;
            if (typeof fun != 'function') {
                throw TypeError('A.reduce: not a function ');
            }
            var i = 0;
            var prev;
            if (arguments.length > argi) {
                var rv = arguments[argi++];
            } else {
                do {
                    if (i in self) {
                        rv = self[i++];
                        break;
                    }
                    if (++i >= len) {
                        throw new TypeError('A.reduce: empty array');
                    }
                } while (true);
            }
            for (; i < len; i++) {
                if (i in self) rv = fun.call(null, rv, self[i], i, self);
            }
            return rv;
        }
    };

    var Libs = function(/*[url,] context*/) {
        var i = 0;
        var self = {
            url: (typeof arguments[i]=='string' && arguments[i++]) || '',
            l: arguments[i] || (function(){return this;}).apply(null)
        };

        self.load = function(src/*, cache*/) {
            tag = document.createElement('script');
            tag.type = 'text/javascript';
            tag.charset = 'UTF-8';
            var del = src.match(/\?/) ? '&' : '?';
            tag.src = arguments[1] ? src : src + del + encodeURI(new Date());
            document.getElementsByTagName('head')[0].appendChild(tag);
        };

        self.loadEach = function(/*[dir,] arr, callback, cache*/) {
            var i=0;
            var dir = (typeof arguments[i]=='string' && arguments[i++])
                || self.url;
            var arr = arguments[i++];
            var f = arguments[i++] || function(){};
            if (!arr.length) { f(self.l); return; }
            var cache = arguments[i++];
            var head = arr.shift();
            var script = head[0];
            var cond = head[1];
            self.load(dir + script, cache);
            self.wait(cond instanceof Array ? cond : [cond],
                      function(){self.loadEach(dir,arr,f,cache)});
        };

        self.wait = function(conds, callback/*, timeout*/) {
            var t = arguments[2] || 100;
            self._wait(conds, callback, self.l, t, 0);
        };

        self._wait = function(conds, callback, l, tt, t) {
            var f = function(v) {
                var r = function(p,c){return p && p[c];};
                return typeof v=='function'
                    ? v(l) : A.reduce(v.split('.'), r,l);
            };
            if (A.every(conds, f)) {
                callback(l);
            } else if (t++ < tt) {
                var next = function(){self._wait(conds,callback,l,tt,t);};
                window.setTimeout(next, 100);
            } else {
                var reason = A.filter(conds, function(item){return !f(item);});
                throw('Libs.wait: timeout - ' + reason.toString() + ' failed');
            }
        };

        return self;
    };

    new Libs(url, null).loadEach(libs, testFunc);
})();
