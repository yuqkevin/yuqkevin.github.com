/*
 * jQuery Plugin and Core functions for SimplyUI, A W3S Framework
 * version: 0.1 (2011.11.1)
 * @requires jQuery v1.4 or later

 * Licensed under the GNU General Public License
 *   http://www.gnu.org/licenses/gpl.html
 *
 * @author Qiang Yu <kevin@w3sofwwares.com>
 */

var W3S = W3S || {};
W3S.Core = W3S.Core||{};
W3S.Core.sequence = W3S.Core.sequence || 1;  // shared sequence for generic use
W3S.Core.curTrigger;
W3S.Core.Store = W3S.Core.Store||{};
W3S.Core.Boxes = {'tab':'.w3s-tab','accordion':'.w3s-accordion','rotator':'.w3s-rotator','grid':'.w3s-grid','tree':'.w3s-tree','dropdown':'.w3s-dropdown','autocomplete':'.w3s-autocomplete'};
W3S.Core.Constant = W3S.Core.Constant||{};
W3S.Core.Constant.undefined;

// To avoid headache garbage collection, save varable into document with w3s-hidden div DOM within target DOM,
// then all variables related to target DOM will be gone if target DOM is removed.
W3S.Core.Store.Dom = {
    get: function(target, name) {
        var targetId = W3S.Core.Util.formatId(target);
        var storeId = '_var'+targetId.substring(1)+'-'+name;
        return $('#'+storeId).text();
    },
    set: function(target, name, val) {
        var targetId = W3S.Core.Util.formatId(target);
        var storeId = '_var'+targetId.substring(1)+'-'+name;
		var storeCls = 'w3s-store_'+name;
        if ($('#'+storeId).html() == null) {
            $(targetId).addClass('w3s-target').before('<div id="'+storeId+'" class="'+storeCls+'" style="display:none;height:0;width:0;">'+val+'</div>');
        } else {
            $('#'+storeId).text(val);
        }
    },
    clear:function(target, name) {
        var targetId = W3S.Core.Util.formatId(target);
        var storeId = '_var'+target.substring(1)+'-'+name;
        $('#'+storeId).remove();
    },
    // return closet target for given object or id
    box: function(child) {
        var obj = typeof child=='string'?$(W3S.Core.Util.formatId(child)):child;
        return obj.closest('.w3s-target').attr('id');
    }
};
W3S.Core.Util = {
    // format given id into #id
    formatId: function(id) {
        var identifier = id;
        if (id) {
            if (id.substring(0,1)!=='#'&&id.substring(0,1)!=='.') {
                identifier = '#'+id;
            }
        }
        return identifier;
    },
    // Put given box to the center of screen
    center: function(id) {
        var offset = 20;
        var box = $(W3S.Core.Util.formatId(id));
        var body = $(W3S.Core.Util.formatId(id)+'-body');
        var differ = {'height':body.outerHeight(true)-body.height(),'width':body.outerWidth(true)-body.width()};

        var page = $('.w3s-layout').length?$('.w3s-layout'):$(window);
        var maxWidth = page.width()-offset-differ.width;
        var maxHeight = $(window).height()-offset-differ.height;
        var p_width = Math.min(body.width(),maxWidth);
        var wleft = ($(window).width()-p_width-differ.width)/2;
        body.width(p_width);
        var h = body.outerHeight();
        body.siblings().each(function(){h += $(this).is(':hidden')?0:$(this).outerHeight(true);});
        var p_height = Math.min(h,maxHeight);
        var wtop = ($(window).height()-p_height)/2;
        box.css({'position':'fixed','left':wleft,'top':wtop,'width':body.outerWidth(),height:p_height});
        body.height(p_height).addClass('w3s-mainbox').w3sBox('resize');
    },
    //read url from a.href and remove base url (which automatically added in IE)
    getHref: function(a) {
        var baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
        return  a.getAttr('href').replace(baseUrl,"");
    },
    // retrieve html of a given object (include wrapper)
    getHtml: function(obj) {
        return $('<div>').append(obj.clone()).remove().html();
    },
    //get client local timezone in hour offset of UTC, e.g -7
    getTimezone: function() {
        var rightNow = new Date();
        var temp = rightNow.toGMTString();
        var gmTime = new Date(temp.substring(0, temp.lastIndexOf(" ")));
        var offset = (rightNow - gmTime) / (1000 * 60 * 60);
        return offset>0?Math.ceil(offset):Math.floor(offset);
    },
    //cookie setter
    setCookie: function(name, val, days) {
        var today=new Date();
        today.setDate(today.getDate()+days);
        document.cookie=name+"="+escape(val)+";path=/"+((days==null)?"":";expires="+today.toUTCString());
    },
    //cookie getter
    getCookie: function(name) {
        var cookies=document.cookie.split(";");
        for (var i=0;i<cookies.length;i++) {
            var x = cookies[i].substr(0,cookies[i].indexOf("="));
            var y = cookies[i].substr(cookies[i].indexOf("=")+1);
            x = x.replace(/^\s+|\s+$/g,"");
            if (x==name) return unescape(y);
          }
        return '';
    },
    //cookie cleaner
    clearCookie: function(name) {
        W3S.Core.Util.setCookie(name, '', -1);
    },
    // convert rgb color code to Hex color code
    rgb2hex: function (rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        return "#" +
            ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[3],10).toString(16)).slice(-2);
    },
    // scan given object, initializing widget if found prefined w3sBox widget in object
    widgetScan: function(obj, options) {
        if (options&&options.boxes) {
            for (var i=0; i<options.boxes.length; i++) {
                var box = options.boxes[i];
                if (W3S.Core.Boxes[box]) {
                    if (obj.is(':visible'+W3S.Core.Boxes[box]+':not(.w3s-stop)')) {
                        obj.w3sBox(box);
                    } else {
                        obj.find(':visible'+W3S.Core.Boxes[box]+':not(.w3s-stop)').w3sBox(box);
                    }
                }
            }
        } else {
            for (var box in W3S.Core.Boxes) {
                if (obj.is(':visible'+W3S.Core.Boxes[box]+':not(.w3s-stop)')) {
                    obj.w3sBox(box);
                } else {
                    obj.find(':visible'+W3S.Core.Boxes[box]+':not(.w3s-stop)').w3sBox(box);
                }
            }
        }
    },
    // print message in given box or alert popup
    // The message can be translated into page's language if there is a translation or just print out original message
    print: function(msg, boxId) {
        var message = W3S.Core.Dics&&W3S.Core.Dics[W3S.Core.language][msg]?W3S.Core.Dics[W3S.Core.language][msg]:msg;
        if (boxId&&$(W3S.Core.Util.formatId(id)).length>0) {
            $(W3S.Core.Util.formatId(id)).html(message);
        } else {
            alert(message);
        }
    }
};
W3S.Core.Ajax = {
    // regular ajax action handler
    action: function(url, id, data, options){
        var conf = {
            'noCache':options&&options.attr&&$.inArray('w3s-nocache', options.attr)>=0,
            'refresh':false  // reload in box
        }
        if (options) $.extend(conf, options);
        if (conf.noCache) url += (url.search(/\?/)==-1?'?':'&')+new Date().getTime();
        var targetId = W3S.Core.Util.formatId(id);
        if (targetId) {
            W3S.Core.curTarget = targetId;
            var target = $(targetId);
            var pos = target.position();
            target.before('<div class="w3s-loading" style="position:absolute;'+
                'left:'+pos.left+'px;top:'+pos.top+'px;'+
                'height:'+target.outerHeight(true)+'px;width:'+target.outerWidth(true)+'px;"></div>');
            var remoteUrl = url;
            if (!jQuery.isEmptyObject(data)) {
            //    remoteUrl = url+(url.search(/\?/)==-1?'?':'&')+decodeURIComponent($.param(data));
            }
            W3S.Core.Store.Dom.set(targetId, 'url', remoteUrl);
            target.load(remoteUrl,data,function(res){
                if (conf.refresh) {
                    // remove header and footer, refresh content only.
                    target.find('.w3s-header').remove();
                    target.find('.w3s-footer').remove();
                }
                W3S.Core.Util.widgetScan($(this));
                $(this).find(':visible.w3s-mainbox').first().w3sBox('resize');
                $('.w3s-loading').remove();
            });
            return false;
        }
        var param = {'ajax':true};
        if (!jQuery.isEmptyObject(data)) $.extend(param, data);
        $.ajax({url:url,data:param,dataType:'json',success:W3S.Core.Ajax.success,type:'post'});
        return false;
    },
    //reload a W3S box with the url stored in the W3S.Core.Store.Dom
    refresh: function(targetId) {
		var target = $(W3S.Core.Util.formatId(targetId));
		while (target.not('body')&&target.siblings('.w3s-store_url').length<1) {
			// find cloisest reloadable target
			target = target.parent();
		}
		if (target.is('body')) {
			// not found, reload whole page instead
			window.location.reload();
			return false;
		}
		// reload target
		var id = target.getAttr('id');
		var url = W3S.Core.Store.Dom.get(id, 'url');
        W3S.Core.Ajax.action(url, id,{},{'refresh':true});
        return false;
    },
    // handler for success ajax post
    success: function(response, status, xhr, f) {
        var form = f?f:$('form').first();  // for version <1.4, no xhr defined, the third argv is f and no 4th argv
        $('.w3s-loading').remove();
        var res;
        if (typeof response=='string') {
            if (response=='reload') {
                window.location.reload();
                return;
            }
            try {
                res = jQuery.parseJSON(response);
            } catch(e) {
                W3S.Core.Util.print(response);
                return;
            }
        } else {
            res = response;
        }

        if (res.message) W3S.Core.Util.print(res.message);
        if (res.success) {
            if (res.success=='reload') {
                if (res.target) {
					if (res.url) {
                        W3S.Core.Ajax.action(res.url, res.target);
					} else {
						W3S.Core.Ajax.refresh(res.target);
					}
                    return false;
                } else {
                    if (res.url) {
                        window.location.href=res.url;
                    } else {
                        window.location.reload();
                    }
                }
            } else if (res.success=='close') {
                form.closest('.w3s-wrapper').remove();
            } else if (res.success=='reset') {
                form[0].reset();
            } else if (res.success=='reset&reload'&&res.target) {
                form[0].reset();
                W3S.Core.Ajax.refresh(res.target);
            } else if (res.success=='close&reload'&&res.target) {
                form.closest('.w3s-wrapper').remove();
                W3S.Core.Ajax.refresh(res.target);
            } else if (res.success=='close&trigger'&&res.target&&res.action) {
                form.closest('.w3s-wrapper').remove();
                $(W3S.Core.Util.formatId(res.target)).trigger(res.action);
            } else if (res.success=='trigger'&&res.target&&res.action) {
                $(W3S.Core.Util.formatId(res.target)).trigger(res.action);
            } else if (res.success=='close&load'&&res.target&&res.url) {
                form.closest('.w3s-wrapper').remove();
                $(W3S.Core.Util.formatId(res.target)).load(res.url);
            } else if (res.success=='re-trigger') {
                W3S.Core.curTrigger.trigger('click');
            } else if (res.success=='load'&&res.url) {
                if (res.target) {
                    W3S.Core.Ajax.action(res.url, W3S.Core.Util.formatId(res.target));
                } else {
                    window.location.href=res.url;
                }
            } else if (res.success=='call'&&res.target) {
                var data = res.data?res.data.split(','):[];
                var fn = window[res.target];
                if (typeof fn==='function') {
                    fn.apply(this, data);
                }
            }
        }
    },
    // before post handler, mainly for field data verification
    beforeSubmit: function(fields, form, options) {
        var cover = form.closest('.w3s-box').length?form.closest('.w3s-box'):form.closest('div');
        if (cover.length<1) cover = form;
        var pos = cover.position();
        cover.before('<div class="w3s-loading" style="position:absolute;'+
                    'left:'+pos.left+'px;top:'+pos.top+'px;'+
                    'height:'+cover.outerHeight()+'px;width:'+cover.outerWidth()+'px;"></div>');
        // 100% height doesn't work in some cases
        var errorMsg = W3S.Core.Ajax.formValidation(form, {errCls:'w3s-error'});
        if (errorMsg) {
            $('.w3s-loading').remove();
            W3S.Core.Util.print(errorMsg);
            return false;
        }
        return true;
    },
    // field data verification
    // check value with type given by class and return error code if error or empty string if OK
    fieldValidation: function(field, regularExp) {
		var tags = {
			'w3s-data-mandatory':'[^\\s]',
			'w3s-data-alphaNum':'\\w',
			'w3s-data-alpha':'[A-z]',
			'w3s-data-numeric':'[0-9]',
			'w3s-data-hex':'[0-9a-fA-F]',
			'w3s-data-email':'[^@]+@[^@\.]+\.[^@]+',
			'w3s-data-date-ymd':'\\d{4}[\\/\\.]?\\d\\d[\\/\\.]?\\d\\d',
			'w3s-data-date-dmy':'\\d\\d\\/?\\d\\d\\/?\\d{4}',
			'w3s-data-date-mdy':'\\d\\d\\/?\\d\\d\\/?\\d{4}'
		};
		if (regularExp) return field.val().match(regularExp)?'':'InvalidDataFormat';
		var val = $.trim(field.val());
		var classes = field.getAttr('class').split(/\s+/);
		for (var i in classes) {
			var type = classes[i];
			for (var tag in tags) {
				var rexp = tags[tag];
				if (type==='w3s-data-mandatory') {
					rexp +='+';
				} else if (!val) {
					return '';
				} else if (type!==tag) {
					if (type.indexOf(tag)!==-1) {
						var len = parseInt(type.substr(tag));
						if (len>0) {
							rexp +='{'+len+',}';
						}
					} else {
						continue;
					}
				}
				rexp = '^'+rexp+'$';
console.log(field.getAttr('name')+':'+val+' regexp:'+rexp+' result:'+val.match(rexp));
				if (!val.match(rexp)) return tag;
			}
		}
        return '';
    },
    // form data validation
    formValidation: function(form, options) {
        var conf = {
            'errCls':'w3s-invalid'
        };
        if (options) $.extend(conf, options);
        var error = '';
        form.find(':input:visible').each(function(){
            error = W3S.Core.Ajax.fieldValidation($(this));
            if (error) {
                $(this).addClass(conf.errCls);
                return error;
            }
        });
        return error;
    }
};
// W3S Event switch
W3S.Core.Event = {
    trigger:function(evt){
        evt.preventDefault();
        var a = $(evt.currentTarget);
        if (a.hasClass('w3s-stop')) evt.stopPropagation();
        // remember trigger which is not form submit or .w3s-tmp
        if (!a.hasClass('w3s-tmp')&&a.attr('name')!='submit') W3S.Core.curTrigger = a;
        if (a.hasClass('w3s-disabled')) return false;
        if (!a.getAttr('rel') || confirm(a.attr('rel'))) {
            W3S.Core.Event.Handler.triggerParse(a, evt);
        }
        return a.hasClass('w3s-stop')?false:true;
    },
    cell: function(evt) {
        evt.preventDefault();
        if ($(this).hasClass('w3s-cell')) $(this).removeClass('w3s-cell');
        $(this).blur(function(){$(this).addClass('w3s-cell');}).change(function(){$(this).addClass('w3s-dirty');});
        return true;
    },
    checkall: function(evt) {
        if ($(this).attr('checked')) {
            $('.'+$(this).attr('name')).attr('checked',true);
        } else {
            $('.'+$(this).attr('name')).attr('checked',false);
        }
        return true;
    },
    menu: function(evt) {
        var item = $(evt.currentTarget);
        item.parentsUntil('.w3s-menu').find('li').removeClass('w3s-selected');
        item.addClass('w3s-selected').parentsUntil('.w3s-menu').addClass('w3s-selected');
        return true;
    },
    resize: function(evt){
        var container = evt.currentTarget.nodeName===W3S.Core.Constant.undefined?'body':evt.currentTarget;
        $(container).find(':visible.w3s-mainbox').w3sBox('resize');
    }
};
W3S.Core.Event.Handler = {
    triggerParse: function(trigger, evt) {
        if (!trigger.getAttr('name')) return false; // no trigger name defined
        var types = trigger.attr('name').split(',');
        var targets = trigger.hasAttr('target')?trigger.attr('target').split(','):[];
        var urls = trigger.hasAttr('href')?W3S.Core.Util.getHref(trigger).split(','):[];
        var title = trigger.hasAttr('title')?trigger.attr('title'):trigger.html();
        var attr = trigger.attr('class').split(/\s+/);
        var extra = trigger.hasAttr('rev')?trigger.attr('rev'):'';
        for (i=0;i<types.length;i++) {
            var type = types[i];
            var target = W3S.Core.Util.formatId(targets[i]);
            var options = {'evtType':evt.type,'url':urls[i],'title':title,'attr':attr,'extra':extra,'pos':{'x':evt.pageX,'y':evt.pageY}};
            W3S.Core.Event.Handler.triggerHandler(trigger, target, type, options);
        }
        return false;
    },
    triggerHandler:function(trigger, target, type, options) {
        switch (type) {
            case 'callback':
                var fn = window[target];
                if (typeof fn==='function') {
                    var data = options.extra.length?options.extra.split(','):[];
                    fn.apply(this, data);
                }
                break;
            case 'clone':
                var item = $(trigger);
                var act = item.hasClass('w3s-icon-add')?'add':'del';
                var row = item.closest('.w3s-clone');
                if (act=='del') {
                    row.remove();
                } else {
                    row.clone().insertAfter(row);
                    item.removeClass('w3s-icon-add').addClass('w3s-icon-delete');
                }
                break;
            case 'close':
                if (target) {
                    $(target).remove();
                } else {
                    trigger.closest('.w3s-wrapper').remove();
                }
                $(window).trigger('resize');
                break;
            case 'reload':
                var targetId = target||W3S.Core.Store.Dom.box(trigger);
                W3S.Core.Ajax.refresh(targetId);
                break;
            case 'load':
            case 'action':
                var data = {};
                if (options.url.search('_token=')==-1) {
                     data = {'_token':''};
                }
                if (options.extra.length) {
                    var names = options.extra.split(',');
                    for (i=0;i<names.length;i++) {
                        var item = $(W3S.Core.Util.formatId(names[i]));
                        data[item.attr('name')] = item.val();
                    }
                }
                if (type=='action'&&target) {
                    // using ajax.success handler
                    data['target'] = target;
                    options['target'] = '';
                }
                W3S.Core.Ajax.action(options.url, target, data, options);
                break;
            case 'reset':
            case 'post':
            case 'submit':
                var form;
                if (target) {
                    form = $(target);
                } else if (trigger.closest('form').length) {
                    form = trigger.closest('form');
                } else if (trigger.parentsUntil('.w3s-wrapper').find('form').length) {
                    form = trigger.parentsUntil('.w3s-wrapper').find('form').last();
                } else {
                    W3S.Core.Util.print('No valid form available');
                    break;
                }
                if (type=='reset') {
                    form[0].reset();
                    break;
                }
                var conf = {'dataType':'json','beforeSubmit':W3S.Core.Ajax.beforeSubmit,'success':W3S.Core.Ajax.success};
                if (form.find('input[type="file"]').length>0) conf['dataType'] = 'html';
                if (form.is('.w3s-ajax')&&(form.data('events')===W3S.Core.Constant.undefined||form.data('events').submit.length<1)) {
					// for the form haven't bind submit event
                    if (jQuery().ajaxForm) {    // check plugin first
                        // jquery third-party plugin ajaxForm installed
                        form.ajaxForm(conf);
                    } else {
                        // using w3sForm
                        form.w3sForm(conf);
                    }
                }
                if (!form.find('input[name="_token"]').length) {
                    var token = trigger.text();
                    if (options.url&&options.url!=='#') {
                        token = options.url.substr(0,1)=='#'?options.url.substr(1):options.url;
                    }
                    form.append('<input type="hidden" name="_button" value="'+token+'" />');
                }
                form.trigger('submit');
                break;
            case 'popup':
                var param = {'idx':++W3S.Core.sequence,'title':options.title,'attr':options.attr,'callback':W3S.Core.Event.Handler.popup};
                $(target?target:'body').w3sBox('popup', options.url, param);
                break;
            case 'overlap':
                var param = {'idx':++W3S.Core.sequence,'title':options.title,'attr':options.attr,'callback':W3S.Core.Event.Handler.overlap};
                $(target?target:'body').w3sBox('overlap', options.url, param);
                break;
            default:
                if (target) {
                    $(target).trigger(type=='trigger'?'click':type);
                }
        }
        return false;
    },
    overlap: function(boxId, options) {
        $(W3S.Core.Util.formatId(boxId)).css({'height':'100%'});
        $(W3S.Core.Util.formatId(options.bodyId)).addClass('w3s-mainbox').w3sBox('resize');
        if (options.url) W3S.Core.Store.Dom.set(options.bodyId, 'url', options.url);
    },
    popup: function(boxId, options) {
        var body = $(W3S.Core.Util.formatId(boxId)+'>.w3s-body');
        var bodyDiv = $(W3S.Core.Util.formatId(boxId)+'>.w3s-body>div');
		var box = $(W3S.Core.Util.formatId(boxId));
        body.width(bodyDiv.outerWidth(true));
		body.height(bodyDiv.outerHeight(true));
        box.width(body.outerWidth(true));
		box.height(body.outerHeight(true));
        W3S.Core.Util.center(boxId);
        if (options.url) W3S.Core.Store.Dom.set(options.bodyId, 'url', options.url);
    }
};

// W3S jQuery plugin: w3sBox, w3sRender, w3sForm(ajax form)
(function($) {
    var methods = {
        overlap: function(url, options) {
            var conf = {
                'type':'w3s-overlap',
                'idx': 0
            };
            if (options) $.extend(conf, options);
             conf.wrapperId = '_'+conf.type+'-'+conf.idx;
            return this.each(function(){
                $('.w3s-wrapper.'+conf.type).remove();
                 var pos = $(this).position();
                var style = 'style="position:absolute;left:'+pos.left+'px;top:'+pos.top+'px;height:'+$(this).outerHeight(true)+'px;width:'+$(this).outerWidth(true)+'px;"';
                $(this).after('<div class="w3s-wrapper '+conf.type+'" id="'+conf.wrapperId+'" '+style+'></div>');
                $('#'+conf.wrapperId).w3sBox('box', url, conf);
            });
        },
        popup: function(url, options) {
            var conf = {
                'type':'w3s-popup',
                'idx': 0
            };
            if (options) $.extend(conf, options);
            conf.wrapperId = '_'+conf.type+'-'+conf.idx;
            conf.modal = $.inArray('w3s-modal', options.attr)>=0;
            return this.each(function(){
                $('.w3s-wrapper.'+conf.type).remove();
                var wrapperCls = 'w3s-wrapper '+conf.type+(conf.modal?' w3s-modal':'');
                var wrapperDom = '<div class="w3s-wrapper '+wrapperCls+'" id="'+conf.wrapperId+'"></div>';
                if (conf.modal) {
                    $('body').append(wrapperDom);
                } else {
                    $(this).after(wrapperDom);
                }
                $('#'+conf.wrapperId).w3sBox('box', url, conf);
            });
        },
        /*** generating dialog box with header,body and footer
         *    in header, there are title, and right buttons for refresh, close
         *    in footer which is optional, the buttons are can be customized by buttons wrapped in div.w3s-footer
        ***/
        box: function(url, options) {
            var wrapperId = options.wrapperId;
            var boxId = options.wrapperId+'-box';
            var bodyId = boxId+'-body';
            var topBtn = [{
                'name':'reload','type':'w3s-icon w3s-icon-refresh','target':bodyId
            },{
                'name':'close','type':'w3s-icon w3s-icon-close','target':''
            }];
            if ($.inArray('w3s-noTopBtn', options.attr)>=0) {
                topBtn = [];
            } else if (!url||url.substr(0,1)=='#'||$.inArray('w3s-noRefresh', options.attr)>=0) {
                topBtn = [{'name':'close','type':'w3s-icon w3s-icon-close','target':''}];
            }
            
            var conf = {
                'headerCls':$.inArray('w3s-noHeader', options.attr)>=0?'w3s-hidden':'',
                'title':options.title===W3S.Core.Constant.undefined?'Popup Window':options.title,
                'topBtns':topBtn,
                'callback':options.callback
            };
            var data = $.extend({'url':url,'wrapperId':wrapperId,'boxId':boxId,'bodyId':bodyId}, options.data);
            return this.each(function(){
                var header = '<div class="w3s-header '+conf.headerCls+'"><div class="w3s-button">';
                for (var i=0; i<conf.topBtns.length; i++) {
                    if (conf.topBtns[i].name) header += '<a class="w3s-trigger '+conf.topBtns[i].type+'" name="'+conf.topBtns[i].name+'" target="'+conf.topBtns[i].target+'" />';
                }
                header += '</div><h1 class="w3s-title">'+conf.title+'</h1></div>';
                var body = '<div class="w3s-body" id="'+bodyId+'"></div>';
                $(this).append('<div class="w3s-box" id="'+boxId+'">'+header+body+'</div>');
                if (url.substr(0,1)=='#') {
                    $(url).clone().removeAttr('id').removeClass('w3s-hidden').appendTo('#'+bodyId);
                    if (conf.callback && typeof(conf.callback) === "function") conf.callback(boxId, data);
                } else {
                      $('#'+bodyId).addClass('w3s-loading').load(url, function(res){
                        W3S.Core.Util.widgetScan($(this));
                        $(this).removeClass('w3s-loading').after($(this).find('div.w3s-footer'));
                        $(this).closest('.w3s-wrapper').find(':visible.w3s-mainbox').first().w3sBox('resize');
                        if (conf.callback && typeof(conf.callback) === "function") conf.callback(boxId, data);
                     });
                }
            });
        },
        resize: function(options) {
            var conf = {
                force: false,
                recursive: true
            }
            conf = $.extend(conf, options);
            var resize = typeof W3SConf!=='undefined'&&W3SConf['resize']===true?true:false;
            if (resize) $('html,body').css('overflow','hidden'); // keeps scrollbar off IE
            return this.each(function() {
                if (conf.force) $(this).addClass('w3s-mainbox');
                if ($(this).closest('.w3s-wrapper').length) resize=true;
                if (resize&&$(this).is(':visible.w3s-mainbox')) {
                    var h_parent = $(this).parent().is('body')?$(window).height():$(this).parent().height();
                    if ($(this).parent().is('body')) {
                        $('body').height(h_parent);
                    }
                    var h_inner = $(this).outerHeight(true);
                    $(this).siblings().each(function() {
                        var h = $(this).outerHeight(true);
                        if ($(this).is(':hidden,.w3s-modal,.w3s-loading') || $(this).css('float')!='none') h=0;
                        h_inner += h;
                    });
                    $(this).height(h_parent-h_inner+$(this).height()).css({'overflow-y':'auto'});
                    if (conf.recursive) $(this).find(':visible.w3s-mainbox').first().w3sBox('resize',options);
                }
            });
        },
        tab: function(options) {
            var eventHandler = function(evt) {
                evt.preventDefault();
                var item = $(evt.currentTarget);
                var a = item.find('a');
                var targetId = W3S.Core.Util.formatId(a.attr('target'));
                var target = $(targetId);
                var url = W3S.Core.Util.getHref(a);
                if (url=='#'&&evt.type=='mouseover'&&target.hasClass('w3s-mover')||evt.type=='click') {
                    item.addClass('w3s-selected').siblings().each(function(){$(this).removeClass('w3s-selected');});
                    target.removeClass('w3s-hidden').siblings().each(function(){$(this).addClass('w3s-hidden');});
                    if (url.substring(0,1)!='#') {
                        W3S.Core.Ajax.action(url,targetId);
                    }
                    var container = target.closest('.w3s-tab');
                    W3S.Core.Util.widgetScan(container);
                    container.find(':visible.w3s-mainbox').first().w3sBox('resize');
                    //$(window).trigger('resize');
                }
                return false;
            };
            return this.each(function() {
                if ($(this).is(':visible:not(.w3s-stop)')) {
                    $(this).addClass('w3s-stop');

                    var items = $(this).find('>ul>li');
                    if ($(this).find('li.w3s-selected').length<1) items.first().addClass('w3s-selected');
                    items.each(function(){
                        $(this).bind('mouseover click', eventHandler);
                        if (!$(this).is('.w3s-selected')) {
                            $('#'+$(this).find('a').attr('target')).addClass('w3s-hidden');
                        }
                    });
                }
            });
        },
        grid :function(options) {
            return this.each(function() {
                if ($(this).is(':visible:not(.w3s-stop)')) {
                    $(this).addClass('w3s-stop');	// avoid multiple rendering
                    if (!$(this).hasClass('w3s-static')) $(this).addClass('w3s-mainbox'); // must be static or mainbox
                    var offset = 16;
                    var width = $(this).width();
                    var table = $(this).find('table').first();
                    var wrapDiv = '<div class="w3s-mainbox" style="border-width:1px;border-top:0;width:'+width+'px;overflow:hidden;overflow-y:scroll;" />';
                    table.width(width-offset).wrap(wrapDiv);
                    var header = table.find('tr>th').first().parent();
                    var caption = table.find('caption');
                    var title = '';
                    if (caption[0]) {
                        title = '<h1 class="w3s-header">'+caption.html()+'</h1>';
                        caption.remove();
                    }
                    table.parent().before(title+'<div style="border-width:1px;border-bottom:0;width:'+width+'px;"></div>');
                    var newHeader = '';
                    var cols = [];
                    header.find('th').each(function(n){
                        newHeader += '<th style="width:'+$(this).width()+'px;"><span>'+$(this).html()+'</span></th>';
                        //cols[n] = {'width':$(this).width()+'px','background-color':$(this).css('background-color'),'color':$(this).css('color')}
                        cols[n] = {'width':$(this).width()+'px'};
                    });
                    header.html(newHeader);
                    header.clone().append('<th style="width:'+offset+'px;"></th>').appendTo(table.parent().prev('div')).wrap('<table />');
                    header.css('visibility','hidden').appendTo(table);
                    if (table.find('tr.w3s-footer').length) {
                        table.parent().after('<div class="w3s-footer" style="margin:0;padding:0;border-width:1px;border-top:0;width:'+width+'px;overflow:hidden;" />');
                        table.find('tr.w3s-footer>td').each(function(n){
                            $(this).css(cols[n])}).wrapInner('<span />');
                        table.find('tr.w3s-footer').
                            append('<td style="width:'+offset+'px;"></td>').
                            appendTo(table.parent().next('div')).wrap('<table style="width:100%;" />');
                    }
                    if ($(this).hasClass('w3s-static')) $(this).find(':visible.w3s-mainbox').first().w3sBox('resize');
                }
            });
        },
        rotator: function(options) {
            var conf = {
                'stay': 5000        // stay in msec before starting fade 
            };
            if (options) $.extend(conf, options);
            var rotator = function(obj, options) {
                var conf = {
                    'cycle':true,
                    'speed': 1000      // fade speed in msec
                };
                if (options) $.extend(conf, options);
                if (obj.hasClass('w3s-nocycle')) conf.cycle=false;
                var items = obj.children();
                if (!items.length) return false;
                var cur = 0;
                var next = 1;
                for (i=0; i<items.length; i++) {
                    if ($(items[i]).hasClass('w3s-selected')) {
                        cur = i;
                        next = (i+1)%items.length;
                        if (next==0&&!conf.cycle) {
                            // stop at end box if set cycle to false
                            clearInterval(conf.id);
                            return;
                        }
                        break;
                    }
                }
                if (obj.closest('.w3s-rotator').is('.w3s-hover')) return;    // stop rotating if mouseover on box
                $(items[cur]).removeClass('w3s-selected').fadeOut(conf.speed,function(){
                    $(items[next]).addClass('w3s-selected').fadeIn(conf.speed);
                });
            };
            return this.each(function() {
                if ($(this).is(':visible:not(.w3s-stop)')) {
                    $(this).addClass('w3s-stop');
                    $(this).hover(function(){$(this).addClass('w3s-hover');}, function(){$(this).removeClass('w3s-hover');}); // hover event
                    var obj = $(this);
                    var children = obj.children();
                    if (children.length) {
                        for (i=0; i<children.length; i++) if (i) $(children[i]).hide();
                        $(children[0]).addClass('w3s-selected');
                        conf.id=setInterval(function(){rotator(obj, conf);}, conf.stay);
                    }
                }
            });
        },
        dropdown: function(options) {
            var eventHandler = function(evt){
                var item = $(evt.currentTarget);
                item.toggleClass('w3s-open');
                if (item.is('.w3s-open')) item.closest('.w3s-dropdown').css({'position':'relative','z-index':100});
                item.siblings('.w3s-body').slideToggle(200,function(){
                    var widget = item.closest('.w3s-dropdown');
                    if (item.is('.w3s-open')) {
                        widget.find('input[type=text]').first().focus();
                    } else {
                        widget.css('position','static'); // keep dom's position default when closed
                    }
                });
                return false;
            }
            return this.each(function(){
                if ($(this).is(':visible:not(.w3s-stop)')) {
                    $(this).addClass('w3s-stop');
                    var trigger = $(this).find(':visible.w3s-header').first();
                    trigger.bind('click', eventHandler);
                    var tr_w = trigger.outerWidth();
                    var tr_h = trigger.height()+(trigger.outerHeight()-trigger.height())/2;
                    var left = $(this).is('.w3s-lalign');
                    var body = $(this).find('.w3s-body').css({'min-width':tr_w,'top':tr_h}).addClass('w3s-stop'); // forbidden resize,grid,... in dropdown;
                    if (left) {
                        var offset = body.outerWidth()-tr_w;
                        body.css({'left':'-'+offset+'px'});
                    }
                }
            });
        },
        accordion: function(options) {
            var eventHandler = function(evt) {
                evt.preventDefault();
                var item = $(evt.currentTarget);
                if (item.is('.w3s-selected')) return false;
                item.siblings('li.w3s-selected').removeClass('w3s-selected').nextAll('.w3s-body').first().
                    slideUp('fast','linear').hide();
                item.addClass('w3s-selected').nextAll('.w3s-body').first().
                    slideDown('fast','linear').
                    fadeIn(function(){
                        var targetId = item.nextAll('.w3s-body').first().attr('id');
                        var url = W3S.Core.Store.Dom.get(targetId,'url');
                        if (url) {
                            W3S.Core.Ajax.action(url, targetId);
                        }
                    });
                return false;
            };
            return this.each(function() {
                if ($(this).is(':visible:not(.w3s-stop)')) {
                    $(this).addClass('w3s-stop');
                    var li = $(this).find('li').first();
                    var li_h = parseFloat(li.css('height'))+parseFloat(li.css('margin-top'))+parseFloat(li.css('margin-bottom'))+
                                parseFloat(li.css('border-top-width'))+parseFloat(li.css('border-bottom-width'));
                    var height = parseFloat($(this).css('height'))- li_h*$(this).find('li').length;
                    $(this).find('li').bind('click',eventHandler);
                    $(this).find('>ul').css({'width':'100%'});
                    var idx = 0;
                    $(this).find('>ul>li>a').each(function(){
                        idx ++;
                        var url = W3S.Core.Util.getHref($(this));
                        var target = '_w3s-accordion-'+idx;
                        var tab = $(this).parent();
                        tab.after('<div id='+target+' class="w3s-body"></div>');
                        var body = $('#'+target);
                        if (url.substr(0,1)=='#'&&$(this).attr('target')) {
                            body.append($('#'+$(this).attr('target')));
                        } else {
                            body.append('<div class="w3s-loading"></div>');
                            W3S.Core.Store.Dom.set(target,'url', url);
                        }
                        body.css('height',height);
                        $('#'+target+'>div').css('min-height',height);
                        if (!tab.is('.w3s-selected')) {
                            body.hide();
                        } else {
                            body.show();
                        }
                    });
                }
            });
        },
        tree: function(options) {
            var eventHandler =  function(evt) {
                evt.preventDefault();
                var item = $(evt.currentTarget).closest('li');
                if (item.is('.w3s-node')) {
                    if (item.is('.w3s-nodeopen')) {
                        item.find('>ul').fadeOut('fast','linear');
                        item.removeClass('w3s-nodeopen');
                    } else {
                        item.find('>ul').fadeIn('fast','linear');
                        item.addClass('w3s-nodeopen');
                    }
                }
                return true;
            };
            return this.each(function() {
                if ($(this).is(':visible:not(.w3s-stop)')) {
                    $(this).addClass('w3s-stop');
                    $(this).find('li .w3s-title').bind('click',eventHandler);
                    var expand = $(this).is('.w3s-expand');
                    var nodeCls = 'w3s-node'+ (expand?' w3s-nodeopen':'');
                    $(this).find('li').each(function(){$(this).addClass($(this).find('ul').length?nodeCls:'w3s-leaf');});
                    if (expand) $(this).find('.w3s-node>ul').css('display','block');
                }
            });
        },
        autocomplete: function(options) {
            // filter listing by give value and return new listing
            var listFilter = function (list, val) {
                var valen = val.length;
                if (!valen) return list; // no value given, return orignal listing
                var listing = [];
                var match_flag = false;
                for (var i=0; i<list.length; i++) {
                    if (list[i].substr(0, valen).toLowerCase()!==val.toLowerCase()) {
                        if (match_flag) break;
                        continue;
                    }
                    listing.push(list[i]);
                    match_flag = true;
                }
                return listing;
            };
            // create dropdownBox
            var dropdownBox = function (obj, list) {
                var dropdownBoxId = 'dropdown-'+obj.attr('name');
                if (list.length==1&&list[0]==obj.val()) return;
                var listing = '<li>'+list.toString().replace(/,/g,'</li><li>')+'</li>';
                var pos = obj.position();
                var min_width = obj.width();
                pos.top += obj.outerHeight();
                obj.after('<ul id="'+dropdownBoxId+'" class="w3s-autocomplete" style="max-height:10em;min-width:'+min_width+'px;top:'+pos.top+'px;left:'+pos.left+'px;">'+listing+'</ul>');
            };
            var itemListing = function(src) {
                // local  processing
                list = $(src).text().split(/,/);
                return list.sort();
            };
            var eventHandlerInputBox = function(evt) {
                if (evt.type=='focusout') {
                    // close dropdownBox if blur but give time to dorpdownBox event handler
                    setTimeout(function(){$('ul.w3s-autocomplete').remove();}, 300);
                    return false;
                }
                $('ul.w3s-autocomplete').remove();
                var inputBox = $(evt.currentTarget);
                var src = inputBox.attr('src');
                if (src&&src.substr(0,1)!=='#') {
                    // remote, download listing and stor into a DOM
                    var id = 'list-'+inputBox.attr('name'); // list Dom ID
                    $('body').append('<div id="'+id+'" class="w3s-hidden"></div>');
                    $('#'+id).load(src, function(res){
                        inputBox.attr('src','#'+id).trigger('click'); // force inputBox src to be local and show dropdownBox
                    });
                    return false;
                }
                // handle listing from local DOM
                var list = itemListing(src);
                if (inputBox.val().length) list = listFilter(list, inputBox.val());
                if (list.length) dropdownBox(inputBox, list);
                return false;   // stop event propagate
            };
            // binding event on dropdownBox
            var eventHandlerOption = function(evt) {
                var item = $(evt.target);
                var dropdownBox = item.closest('ul');
                var inputBox = dropdownBox.prev('input.w3s-autocomplete');
                inputBox.val(item.text());
                dropdownBox.remove();
                return true;
            };
            $('ul.w3s-autocomplete>li').live('click', eventHandlerOption); // binding event handler for all item whenever has been created or not
            this.live('click keyup focusout', eventHandlerInputBox);
            return this.each(function() {
                var width = $(this).width();
                $(this).width(width-10);
            });
        }
    };
	// check if attribute is defined
    $.fn.hasAttr = function(attrName) {
        var undefined;
        var attr = $(this).attr(attrName);
        return !(attr===undefined||attr===false);
    };
	// read the attribute or given empty string undefined
	$.fn.getAttr = function(attrName, defaultVal) {
		var undefined;
		var attr = $(this).attr(attrName);
		if (attr===undefined||attr===false) attr = '';
		return attr?attr:(defaultVal!==undefined?defaultVal:'');
	};
    // W3S box widgets
    $.fn.w3sBox = function(method, options) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method ) {
            return methods.init.apply(this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.w3sBox' );
        }
    };
    // W3s Box show handler. To render w3sBox on fly when the target box is shown
    $.fn.w3sRender = function(options) {
        return this.each(function(){
            $(this).show();
            W3S.Core.Util.widgetScan($(this), options);
        });
    };
    // W3S ajax form
    $.fn.w3sForm = function(options) {
        var conf = {
            'dataType':'json',
            'beforeSubmit':W3S.Core.Ajax.beforeSubmit,
            'success':W3S.Core.Ajax.success
        };
        if (options) $.extend(conf, options);

        return this.each(function() {
            if (!conf.url) conf.url = $(this).attr('action');
            if ($(this).find('input[type="file"]').length>0) {
                // form with file uploading, using iframe to do the job
                // insert ifrme dom
                var form_id = $(this).attr('id');
                if (!form_id) {
                    form_id = '_w3s-from-'+(++W3S.Core.sequence);
                    $(this).attr('id', form_id);
                }
                var id = form_id+'if-id';    // iframe's id
                var name = form_id+'if-name';    // iframe's name
                $(this).submit(function(){
                    if (conf.beforeSubmit&&typeof conf.beforeSubmit=='function') {
						// do pre-post handle first
                        if (!conf.beforeSubmit(null, $(this), conf)) return false;    // field check error, do not submit.
                    }
					// create iframe for file upload
                    $(this).append('<iframe id="'+id+'" name="'+name+'" src="" style="width:0;height:0;display:none;"></iframe>');
                    // manipulate form parameters: set enctype for file upload, switch target to iframe
                    $(this).attr({'enctype':'multipart/form-data','target':name});
                    // set observer for iframe loading
                    $('#'+id).load(function(){
                        var res = $(this).contents().find('body').html();
                        // remove iframe (the little delay is to satisfy FF or the connecting icon may keep alive)
                        setTimeout(function(){$('#'+id).remove();},    100);
                        // convert content of iframe into json and send result to success handler
                        if (res) conf.success(jQuery.parseJSON(res));
                        return false;
                    });
                    return true;
                });
            } else {
                // submit handler for regular post
                $(this).submit(function(){
                    var ok = true;
                    // check if a submitBefore function
                    if (conf.beforeSubmit&&typeof conf.beforeSubmit=='function') {
                        ok = conf.beforeSubmit(null, $(this), conf);
                    }
                    if (ok) {
                        // form without file uploading
                        jQuery.post(
                            conf.url,
                            $(this).serialize(),
                            conf.success,
                            conf.dataType
                        );
                    }
                    return false;   // disable regular post
                });
            }
        });
    };
})(jQuery);

$(document).ready(function(){
	W3S.Core.language = $('html').getAttr('lang','en').toLowerCase();
    $('a.w3s-trigger').live('click', W3S.Core.Event.trigger);
    $('a.w3s-mover').live('mouseover mouseout', W3S.Core.Event.trigger);
    $('input.w3s-cell').live('click', W3S.Core.Event.cell);
    $('input[type=checkbox].w3s-checkall').live('click', W3S.Core.Event.checkall);
    $('.w3s-menu li').live('click',W3S.Core.Event.menu);
    for (var box in W3S.Core.Boxes) {
        $(W3S.Core.Boxes[box]).w3sBox(box);
    }
    $(window).resize(W3S.Core.Event.resize);
    $(document).keypress(function(e){
        if(e.keyCode==13){
            if ($('textarea').length>0) return true;
            var btns = [];
            if ($('.w3s-wrapp .w3s-footer').length) {
                btns = $('.w3s-wrapp .w3s-footer').find('a.w3s-trigger[name="submit"]');
            } else if ($('a.w3s-trigger[name="submit"]').length) {
                btns = $('a.w3s-trigger[name="submit"]');
            } else {
                // temporary top trigger like login form
                btns = $('a.w3s-tmp');
            }
            if (btns.length==1) btns.trigger('click');
        }
    });
});
