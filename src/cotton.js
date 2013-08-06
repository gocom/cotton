/**
 * Cotton.js - Textile quick tag bar
 *
 * @link    https://github.com/gocom/cotton
 * @license MIT
 */

/*
 * Copyright (C) 2013 Jukka Svahn
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function (factory)
{
    'use strict';

    if (typeof define === 'function' && define.amd)
    {
        define(['jquery'], factory);
    }
    else
    {
        factory(window.jQuery);
    }
}(function ($)
{
    'use strict';

    var opt = {}, field, selection, is = {}, words = {}, lines = {}, methods = {}, format = {}, regexLine = /\r\n|\r|\n/;

    methods.init = function ()
    {
        return this.on('click.cotton', function (e)
        {
            e.preventDefault();

            $.each(this.attributes, function(index, attr)
            {
                if (attr.name.indexOf('data-') === 0)
                {
                    opt[attr.name.substr(5)] = attr.value;
                }
            });

            field = $($(this).attr('href'));
            field.focus();
            selection = methods.caret.apply(field);

            words = { start : 0, end : 0, text : [] };
            lines = { start : 0, end : 0, text : [] };

            var i = 0, ls = 0, le = 0;

            $.each(field.val().split(regexLine), function(index, line)
            {
                if (ls > selection.end)
                {
                    return false;
                }

                le = ls+line.length;
                        
                if (le >= selection.start)
                {
                    if (!lines.text[0])
                    {
                        lines.start = ls;
                    }

                    lines.text.push(line);
                    lines.end = le;
                }

                ls = le+1;

                $.each(line.split(' '), function(index, w)
                {
                    if (i > selection.end)
                    {
                        return;
                    }

                    if (i+w.length >= selection.start)
                    {
                        if (!words.text[0])
                        {
                            words.start = i;
                        }

                        words.text.push(w);
                        words.end = i+w.length;
                    }

                    i += w.length+1;
                });
            });

            if (selection.start)
            {
                selection.characterBefore = field.val().substr(selection.start-1, 1);
                is.linefirst = selection.characterBefore === '\n';
            }
            else
            {
                selection.characterBefore = '';
                is.linefirst = true;
            }

            is.empty = (!selection.text);
            is.whitespace = (!is.empty && !$.trim(selection.text));
            is.inline = (selection.text.indexOf('\n') === -1);
 
            var offset = lines.end, c = field.val();

            is.paragraph = c.indexOf('\n\n', offset) !== -1 || c.indexOf('\r\n\r\n', offset) !== -1;
            is.block = (!is.paragraph && c.indexOf('\n', offset) !== -1); // TODO: Not needed?

            if (format[opt.callback])
            {
                format[opt.callback]();

                methods.caret.apply(field, [{
                    start : selection.end,
                    end : selection.end
                }]);
            }
        });
    };

    /**
     * Caret code based on jCaret
     * @author C. F., Wong (Cloudgen)
     * @link http://code.google.com/p/jcaret/
     *
     * Copyright (c) 2010 C. F., Wong (http://cloudgen.w0ng.hk)
     * Licensed under the MIT License:
     * http://www.opensource.org/licenses/mit-license.php
     */

    methods.caret = function (options)
    {
        var $this = this.get(0), start = 0, end = 0;

        if ($.type(options) === 'object' && $.type(options.start) === 'number' && $.type(options.end) === 'number')
        {
            if ($.type($this.setSelectionRange) !== 'undefined')
            {
                $this.setSelectionRange(options.start, options.end);
                this.eq(0).focus();
            }

            return this;
        }

        if ($.type($this.selectionStart) !== 'undefined')
        {
            start = $this.selectionStart;
            end = $this.selectionEnd;
        }

        return {
            start : start,
            end   : end,
            text  : this.eq(0).val().substring(start, end)
        };
    };

    /**
     * Replaces a selection with Textile markup.
     *
     * @param {string}  string
     * @param {integer} start
     * @param {integer} end
     */

    var insert = function (string, start, end)
    {
        if ($.type(start) === 'undefined')
        {
            start = selection.start;
        }

        if ($.type(end) === 'undefined')
        {
            end = selection.end;
        }

        field.val(field.val().substring(0, start) + string + field.val().substring(end));
        selection.end = start + string.length;
    };

    /**
     * Formats a code block.
     */

    format.code = function ()
    {
        if ((is.linefirst && is.empty) || !is.inline)
        {
            insert(
                'bc. ' + $.trim(lines.text.join('\n')),
                lines.start,
                lines.end
            );

            return;
        }

        format.inline();
    };

    /**
     * Formats a list such as &lt;ul&gt; and &lt;ol&gt;.
     */

    format.list = function ()
    {
        var out = [];

        $.each(lines.text, function (key, line)
        {
            out.push(((is.linefirst && is.empty) || $.trim(line) ? opt.bullet + ' ' : '') + line);
        });

        out = out.join('\n');
        insert(out, lines.start, lines.end);
        selection.end = lines.start + out.length;
    };

    /**
     * Formats simple inline tags.
     *
     * Works for elements such as &lt;strong&gt;, &lt;bold&gt;, 
     * &lt;em&gt;, &lt;ins&gt;, &lt;del&gt;.
     */

    format.inline = function ()
    {
        if (is.empty && words.text.length === 1)
        {
            selection.start = words.start;
            selection.end = words.end;
            selection.text = words.text.join(' ');
        }

        if (!is.whitespace && is.inline)
        {
            insert(opt.before + selection.text + opt.after);
        }
        else
        {
            insert(selection.text + opt.before + opt.after);
        }
    };

    /**
     * Formats a heading.
     */

    format.heading = function ()
    {
        var line = lines.text.join('\n'), start = line.substr(0, 3);

        if ($.inArray(start, ['h1.', 'h2.', 'h3.', 'h4.', 'h5.', 'h6.']) !== -1)
        {
            if (start === 'h6.')
            {
                start = 1;
            }
            else
            {
                start = parseInt(start.substr(1, 1), 10) + 1;
            }

            insert(start, lines.start + 1, lines.start + 2);
            selection.end = lines.start + line.length;
            return;
        }

        format.block();
    };

    /**
     * Formats a block.
     */

    format.block = function ()
    {
        insert(opt.tag +'. ' + $.trim(lines.text.join('\n')) + (!is.paragraph ? '\n\n' : ''), lines.start, lines.end);
    };

    /**
     * Formats a link.
     */

    format.link = function ()
    {
        var text = selection.text, link = 'http://';

        if (is.empty && words.text.length === 1)
        {
            selection.start = words.start;
            selection.end = words.end;
            text = words.text.join(' ');
        }

        if (text.indexOf('http://') === 0 || text.indexOf('https://') === 0)
        {
            link = text;
            text = '$';
        }
        else if (text.indexOf('www.') === 0)
        {
            link = 'http://'+text;
            text = '$';
        }

        insert('"' + text + '":'+link);
    };

    /**
     * Formats an acronym.
     */

    format.acronym = function ()
    {
        var text = selection.text, abc = 'ABC';

        if (is.empty)
        {
            if (words.text.length === 1 && words.text[0].length >= 3 && /[:lower:]/.test(words.text[0]) === false)
            {
                abc = words.text[0];
            }
            else
            {
                text = words.text.join(' ');
            }

            selection.start = words.start;
            selection.end = words.end;
        }

        insert(abc+'('+text+')');
    };

    /**
     * Renders a Textile editing bar.
     *
     * @param {String} [method='init'] Called method
     * @param {Object} [options={}]    Options passed to the method
     */

    $.fn.cotton = function (method, options)
    {
        if ($.type(method) !== 'string' || $.type(methods[method]) !== 'function')
        {
            options = method;
            method = 'init';
        }

        return methods[method].call(this, options);
    };
}));