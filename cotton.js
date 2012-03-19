
/*!
 * Rah_textile_bar
 * @author Jukka Svahn
 */

(function($, len, createRange, duplicate){

	var opt = {}, is = {};
	
	var methods = {
		
		/**
		 * Initialize
		 */
		
		init : function() {
			this.click(function(e) {
				e.preventDefault();

				$.each(this.attributes, function(index, attr) {
					if(attr.name.substr(0, 5) == 'data-') {
						opt[attr.name.substr(5)] = attr.value;
					}
				});
				
				opt.field = $('#'+$(this).attr('href').substr(1));
				opt.field.focus();
				opt.selection = opt.field.rah_textile_bar('caret');
				opt.lines = opt.field.val().split(/\r\n|\r|\n/);
				
				opt.selection.words = {
					start : 0,
					end : 0,
					text : [],
				};
				
				opt.selection.lines = {
					start : 0,
					end : 0,
					text : [],
				};
				
				var i = 0, lineend = 0, linestart = 0;
				
				$.each(opt.lines, function(linenumber, line){
					
					if(linestart > opt.selection.end) {
						return;
					}
				
					lineend = linestart+line.length;
						
					if(lineend >= opt.selection.start) {
						
						if(!opt.selection.lines.text[0]) {
							opt.selection.lines.start = linestart;
						}
						
						opt.selection.lines.text.push(line);
						opt.selection.lines.end = lineend;
					}
					
					linestart = lineend+1;

					$.each(line.split(' '), function(index, word) {
						
						if(i > opt.selection.end) {
							return;
						}
						
						if(i+word.length >= opt.selection.start) {
							
							if(!opt.selection.words.text[0]) {
								opt.selection.words.start = i;
							}
							
							opt.selection.words.text.push(word);
							opt.selection.words.end = i+word.length;
						}
						
						i += word.length+1;
					});
				});
				
				opt.selection.char_before = (
					opt.selection.start < 1 ? 
						'' : opt.field.val().substr(opt.selection.start-1, 1)
				);
				is.empty = (!opt.selection.text);
				is.whitespace = (!is.empty && !$.trim(opt.selection.text));
				is.inline = (opt.selection.text.indexOf("\n") == -1);
				is.linefirst = (
					opt.selection.start < 1 || 
					opt.selection.char_before == "\n" || 
					opt.selection.char_before == "\r"
				);
				
				var offset = opt.selection.lines.end;
				var c = opt.field.val().replace(/(\r\n|\r)/gm, "\n");
				
				is.paragraph = (
					c.indexOf("\n\n", offset) >= 0
				);
				
				is.block = (
					!is.paragraph &&
					c.indexOf("\n", offset) >= 0
				);
				
				if(!format[opt.callback]){
					return;
				}
					
				var f = format[opt.callback]();
				
				if(f) {
					opt.field.val(f);
				}
				
				opt.field.rah_textile_bar('caret', {
					start : opt.selection.end, 
					end : opt.selection.end
				});
			});
		},
		
		/*!
		 * Caret code based on jCaret
		 * @author C. F., Wong (Cloudgen)
		 * @link http://code.google.com/p/jcaret/
		 *
		 * Copyright (c) 2010 C. F., Wong (http://cloudgen.w0ng.hk)
		 * Licensed under the MIT License:
		 * http://www.opensource.org/licenses/mit-license.php
		 */
		
		caret : function(options) {
			
			var start, end, t = this[0], browser = $.browser.msie;
			
			//t.value = t.value.replace(/(\r\n|\r)/gm, "\n");
			
			if(
				typeof options === "object" && 
				typeof options.start === "number" && 
				typeof options.end === "number"
			) {
				start = options.start;
				end = options.end;
			}
			
			if(typeof start != "undefined"){
				
				if(browser){
					var selRange = this[0].createTextRange();
					selRange.collapse(true);
					selRange.moveStart('character', start);
					selRange.moveEnd('character', end-start);
					selRange.select();
				}
				
				else {
					this[0].selectionStart = start;
					this[0].selectionEnd = end;
				}
				
				this[0].focus();
				return this;
			}
			
			else {
			
				if(browser){
					
					var selection = document.selection;
					
					if (this[0].tagName.toLowerCase() != "textarea") {
						var val = this.val(),
						range = selection[createRange]()[duplicate]();
						range.moveEnd("character", val[len]);
						var s = (range.text == "" ? val[len]:val.lastIndexOf(range.text));
						range = selection[createRange]()[duplicate]();
						range.moveStart("character", -val[len]);
						var e = range.text[len];
					}
					
					else {
						var range = selection[createRange](),
						stored_range = range[duplicate]();
						stored_range.moveToElementText(this[0]);
						stored_range.setEndPoint('EndToEnd', range);
						var s = stored_range.text[len] - range.text[len],
						e = s + range.text[len]
					}
				}
			
				else {
					var s = t.selectionStart, 
					e = t.selectionEnd;
				}
			
				return {
					start : s,
					end : e,
					text : t.value.substring(s,e)
				};
			}
		}
	};
	
	/**
	 * Replaces selection with Textile markup
	 * @param string string
	 * @param int start
	 * @param int end
	 */
	
	var insert = function(string, start, end) {
		
		if(typeof start === "undefined") {
			start = opt.selection.start;
		}
		
		if(typeof end === "undefined") {
			end = opt.selection.end;
		}
		
		opt.field.val(opt.field.val().substring(0, start) + string + opt.field.val().substring(end));
		opt.selection.end = start + string.length;
	};
	
	/**
	 * Formatting methods
	 */
	
	var format = {
		
		/**
		 * Formats a code block
		 */
		
		code : function() {
			
			if(
				(is.linefirst && is.empty) ||
				!is.inline
			) {
				insert(
					'bc. ' + $.trim(opt.selection.lines.text.join("\n")),
					opt.selection.lines.start, 
					opt.selection.lines.end
				);
				return;
			}
			
			insert('@'+opt.selection.text+'@');
			return;
		},
		
		/**
		 * Formats lists: ul, ol
		 */
		
		list : function() {
			
			var out = [];
			
			$.each(opt.selection.lines.text, function(key, line){
				out.push(( (is.linefirst && is.empty) || $.trim(line) ? opt.bullet + ' ' : '') + line);
			});
			
			out = out.join("\n");
			
			insert(
				out, 
				opt.selection.lines.start, 
				opt.selection.lines.end
			);
			
			opt.selection.end = opt.selection.lines.start + out.length;
		},
		
		/**
		 * Formats simple inline tags: strong, bold, em, ins, del
		 */
		
		inline : function() {
			var r = !is.whitespace && is.inline ? 
				opt.before + opt.selection.text + opt.after : 
				opt.selection.text + opt.before + opt.after;
			
			insert(r);
		},
		
		/**
		 * Formats headings
		 */
		
		heading : function() {
			
			var line = opt.selection.lines.text.join("\n");
			var s = line.substr(0,3);
			
			if(jQuery.inArray(s, ['h1.', 'h2.', 'h3.', 'h4.', 'h5.', 'h6.']) >= 0) {
				s = s == 'h6.' ? 1 : parseInt(s.substr(1,1)) + 1;
				insert(s, opt.selection.lines.start+1, opt.selection.lines.start+2);
				opt.selection.end = opt.selection.lines.start+line.length;
				return;
			}
			
			insert(
				opt.level +'. ' + line + (!is.paragraph ? "\n\n" : ''),
				opt.selection.lines.start, 
				opt.selection.lines.end
			);
		},
		
		/**
		 * Formats normal blocks
		 */
		
		block : function() {
			insert(
				opt['tag'] +'. ' + $.trim(opt.selection.lines.text.join("\n")) + 
				(!is.paragraph ? "\n\n" : ''),
				opt.selection.lines.start, 
				opt.selection.lines.end
			);
		},
		
		/**
		 * Formats a image
		 */
		
		image : function() {
		},
		
		/**
		 * Formats a link
		 */
		
		link : function() {
			
			var text = opt.selection.text;
			var link = 'http://';
			
			if(
				is.empty &&
				opt.selection.words.text.length == 1
			) {
				opt.selection.start = opt.selection.words.start;
				opt.selection.end = opt.selection.words.end;
				text = opt.selection.words.text.join(' ');
			}
			
			if(text.indexOf('http://') == 0 || text.indexOf('https://') == 0) {
				link = text;
				text = '$';
			}
			
			else if(text.indexOf('www.') == 0) {
				link = 'http://'+text;
				text = '$';
			}
			
			insert('"' + text + '":'+link);
		}
	};

	$.fn.rah_textile_bar = function(method) {
		
		if(methods[method]){
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		
		else if(typeof method === 'object' || !method){
			return methods.init.apply(this, arguments);
		}
		
		else {
			$.error('[rah_textile_bar: unknown method '+method+']');
		}
	};

})(jQuery, 'length', 'createRange', 'duplicate');