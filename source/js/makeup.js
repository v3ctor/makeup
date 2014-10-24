/**
 * Wake up!
 * Grab a brush and put a little makeup!
 *
 * @requires jQuery
 * @requires lodash
 */
var Makeup = (function() {
    var makeup;

    var internationalDelimiters = {
        be: '__',
        bm: '--',
        em: '--',
        mm: '--'
    };

    var russianDelimiters = {
        be: '__',
        bm: '_',
        em: '_',
        mm: '_'
    };

    var internalNamingRules = {
        delimiters: {
            be: '__',
            bm: '--',
            em: '--',
            mm: '-'
        },
        bevis: false,
        logic: true
    };

    function Makeup(options) {
        if (typeof makeup == 'object') {
            return makeup;
        } else {
            makeup = this;
        }

        makeup._init(options);
    }

    /**
     * Validate range value
     *
     * @param {Number} value
     * @param {Object} options
     */
    function validateRangeValue(value, options) {
        if (value < options.min) {
            return options.min;
        }

        if (value > options.max) {
            return options.max;
        }

        return value;
    }

    Makeup.fn = Makeup.prototype = {
        constructor: Makeup,

        _state: {},

        el: {},

        _init: function(options) {
            var that = this;

            this._params = this._viewModel(_.merge({

                wrapper: $('body'),

                selectors: {
                    root: '.makeup',

                    searchInput: '.makeup__search-input',

                    sidebar: '.makeup__aside',
                    scroller: '.makeup__aside-in',
                    scrollerTrack: '.makeup__aside-track',
                    scrollerTrackBar: '.makeup__aside-track-bar',

                    nav: '.makeup__nav',
                    navList: '.makeup__nav-list',
                    navListItem: '.makeup__nav-list-item',

                    module: '.makeup__module',
                    moduleHeader: '.makeup__module-header',

                    subnav: '.makeup__subnav',
                    subnavItem: '.makeup__subnav-item',
                    subnavLink: '.makeup__subnav-link',

                    modeControl: '.makeup__mode',
                    bgControl: '.makeup__bg',

                    slider: '.makeup__slider',
                    sliderTrack: '.makeup__slider-track',
                    sliderTrackRunner: '.makeup__slider-track-runner',

                    ruler: '.makeup__ruler-track',
                    rulerTrack: '.makeup__ruler-track-in',
                    rulerTrackActive: '.makeup__ruler-track-active',
                    rulerTrackRunner: '.makeup__ruler-track-runner',
                    rulerTrackPoint: '.makeup__ruler-track-point',

                    statusBar: '.makeup__status',

                    box: '.makeup__main',
                    container: '.makeup__container-in',
                    containerImage: '.makeup__container-image',
                    containerImageRegular: '.makeup__container-image-regular',
                    containerImageInverse: '.makeup__container-image-inverse',
                    containerMarkup: '.makeup__container-markup'
                },

                modifiers: {
                    hiddenModule: 'makeup__module--hidden',
                    hiddenModuleType: 'makeup__subnav-link--hidden',
                    baron: 'makeup__aside--baron'
                },

                menu: {
                    tooltip: 'Toggle menu',
                    checked: true
                },

                search: {
                    placeholder: ''
                },

                mode: {
                    label: 'Mode',

                    items: [
                        {
                            tooltip: 'Image',
                            value: '1',
                            checked: true
                        },
                        {
                            tooltip: 'Markup',
                            value: '2',
                        },
                        {
                            tooltip: 'Markup and image',
                            value: '3',
                        },
                        {
                            tooltip: 'Markup and inversed image',
                            value: '4',
                        }
                    ]
                },

                background: {
                    label: 'Background',

                    items: [
                        {
                            tooltip: 'Gray',
                            value: 'color',
                            checked: true
                        },
                        {
                            tooltip: 'Transparency grid',
                            value: 'transparency'
                        }
                    ]
                },

                transparency: {
                    label: 'Transparency',

                    slider: {
                        min: 0,
                        max: 1,
                        value: 1
                    }
                },

                zoom: {
                    label: 'Zoom',

                    slider: {
                        min: 1,
                        max: 4,
                        value: 1
                    }
                },

                ruler: {
                    h: {
                        type: 'ruler',
                        name: 'makeup-ruler-h',

                        slider: {
                            min: 0,
                            max: 2000,
                            value: 400
                        }
                    },
                    v: {
                        type: 'ruler',
                        name: 'makeup-ruler-v',

                        slider: {
                            min: 0,
                            max: 1000,
                            step: 10
                        }
                    }
                },

                smiley: {
                    tooltip: 'Smiley styles on markup container',
                    checked: false
                },

                renderModule: function() {},

                namingRules: internalNamingRules

            }, options));

            this._params.wrapper.append(makeupTemplates.makeup(this._params));

            _.each(this._params.selectors, function(item, key) {
                that.el[key] = $(item);
            });

            this._state = new State();
            this._bindListeners();
        },

        _bindListeners: function() {
            var makeup = this,
                params = this._params,
                win = $(window);
            /*
            — поиск
            — линейки
            — дополнительно: статусбар (ховер по элементам, комментарии к модулю/типу)
            — дополнительно: настройки (масштаб)
            */

            this._bindMenuListeners();

            if (params.search) {
                this._bindSearchListeners();
            }

            if (params.mode) {
                this._bindModesListeners();
            }

            if (params.background) {
                this._bindBackgroundsListeners();
            }

            if (params.transparency) {
                this._bindTransparencyListeners();
            }

            if (params.zoom) {
                this._bindZoomListeners();
            }

            if (params.ruler) {
                this._bindRulerListeners();
            }

            if (params.smiley) {
                this._bindSmileyListeners();
            }

            win.on('statechange', function(e) {
                makeup._setState(e.state);
            });
        },

        /**
         * Menu
         */
        _bindMenuListeners: function() {
            var that = this,
                makeupElement = $(makeup._params.selectors.root),
                sidebar = $(this._params.selectors.sidebar),
                moduleHeader = $(this._params.selectors.moduleHeader),
                moduleType = $(this._params.selectors.subnavLink),
                win = $(window);

            // Render default module
            that._state.set(that._setDefaultMenuState(that._state._params));

            moduleHeader.on('click', function() {
                var module = this.parentNode,
                    group = module.parentNode;

                if (that._mod(module).expandable) {
                    that._toggleMenuItem(module);
                } else {
                    var moduleId = $(module).attr('data-id'),
                        groupId = $(group).attr('data-id');

                    that._state.set({
                        group: groupId,
                        module: moduleId
                    });
                }
            });

            moduleType.on('click', function() {
                var typeGroup = this.parentNode,
                    module = typeGroup.parentNode.parentNode,
                    group = module.parentNode,
                    state = {
                        group: $(group).attr('data-id'),
                        module: $(module).attr('data-id'),
                        typeGroup: $(typeGroup).attr('data-id'),
                        type: $(this).attr('data-id')
                    };

                that._state.set(state);
            });

            if (this._params.menu) {
                var toggleMenu = $('#makeup-menu');

                // Set default mode
                if (!this._state._params.hasOwnProperty('menu')) {
                    var defaultMenu = makeup._mod(makeupElement[0]).menu || true;

                    makeup._state.set({ menu: defaultMenu });
                }

                toggleMenu.on('change', function() {
                    makeup._state.set({ menu: this.checked });
                });

                win.on('keydown', function(e) {
                    var key = makeup._getKey(e);

                    if (key == 192 || key == 220) {
                        makeup._state.set({ menu: !toggleMenu[0].checked });
                    }
                });
            }

            this._baron = sidebar.baron({
                scroller: this._params.selectors.scroller,
                track:    this._params.selectors.scrollerTrack,
                bar:      this._params.selectors.scrollerTrackBar,
                barOnCls: this._params.modifiers.baron
            });
        },

        _setDefaultMenuState: function(state) {
            var data = this._params.data,
                defaultState = {},
                fields = ['group', 'module', 'typeGroup', 'type'];

            validatePathField(data, +state.group || 0, 0);

            /**
             * Validate path field
             *
             * @param {Array} elements
             * @param {Number} id of element
             * @param {Number} id of field name (e.g. 0 for 'group', 1 for 'module')
             */
            function validatePathField(data, key, fieldKey) {
                // Validate key
                key = data[key] ? key : 0;
                defaultState[fields[fieldKey]] = key;

                // Check for children
                var field = fields[fieldKey + 1];

                if (data[key] && data[key].items && data[key].items.length && field) {
                    validatePathField(data[key].items, +state[field] || 0, fieldKey + 1);
                }
            }

            return defaultState;
        },

        /**
         * Apply state in aside panel
         */
        _setCurrentMenuItem: function(groupId, moduleId, typeGroupId, typeId) {
            // expand if need
            // set as current
            var that = this,
                data = that._params.data,
                moduleConfig = data[groupId].items[moduleId],
                typeConfig,

                status = '',
                directory,
                current,
                type;

            // Set status
            if (moduleConfig) {
                if (moduleConfig.items) {
                    var types = moduleConfig.items[typeGroupId];

                    typeConfig = types && types.items && types.items[typeId];
                }

                status += escapeHTML(moduleConfig.name);

                if (typeConfig && typeConfig.name) {
                    status += ' → ' + escapeHTML(trimString(typeConfig.name));
                }
            }
            this._setStatus(status);

            // Find current
            directory = this.el.navListItem
                .filter('[data-id="' + groupId + '"]')
                .find(that._params.selectors.module)
                .filter('[data-id="' + moduleId + '"]');

            if (typeGroupId !== undefined && typeId !== undefined) {
                current = directory
                    .find(that._params.selectors.subnavItem)
                    .filter('[data-id="' + typeGroupId + '"]')
                    .find(that._params.selectors.subnavLink)
                    .filter('[data-id="' + typeId + '"]');
            }

            setCurrent(current && current[0] || directory && directory[0]);

            // Expand parent if need
            if (current && current[0]) {
                this._mod(directory[0], {expanded: true});
            }

            /**
             * Set current menu item
             */
            function setCurrent(currentItem) {
                var module = $(that._params.selectors.module),
                    moduleType = $(that._params.selectors.subnavLink);

                module.each(function(i) {
                    that._mod(module[i], {current: false});
                });
                moduleType.each(function(i) {
                    that._mod(moduleType[i], {current: false});
                });

                if (currentItem) {
                    that._mod(currentItem, {current: true});
                }
            }
        },

        /**
         * Toggle navigation item
         */
        _toggleMenuItem: function(directory) {
            this._mod(directory, {expanded: !this._mod(directory).expanded});
            this._baron.update();
        },

        /**
         * Search control listeners
         */
        _bindSearchListeners: function() {
            var makeup = this,
                searchInput = $(makeup._params.selectors.searchInput),
                module = $(makeup._params.selectors.module),
                moduleType = $(makeup._params.selectors.moduleType);

            searchInput.on('keyup', function() {
                module.each(function() {
                    makeup._mod(this, { hidden: false });
                });

                moduleType.each(function() {
                    this._shown = true;
                    makeup._mod(this, { hidden: false });
                });

                var re = searchInput.val().replace(/\s+/g, '');

                if (!re) {
                    return;
                }

                re = _(re)
                    .reduce(function(chars, chr) {
                        chars.push(escapeRegExp(chr));
                        return chars;
                    }, [])
                    .join('.*?');

                re = new RegExp('.*?' + re + '.*?', 'i');

                moduleType.each(function() {
                    if (!re.test(stripTags(this.innerHTML).replace(/\s+/g, ''))) {
                        this._shown = false;
                        makeup._mod(this, { hidden: true });
                    }
                });

                module.each(function() {
                    var module = $(this).find(makeup._params.selectors.moduleType);

                    var hasShown = false;

                    module.each(function() {
                        if (this._shown) {
                            hasShown = true;
                            return false;
                        }
                    });

                    if (hasShown) {
                        makeup._mod(this, { expanded: true });
                    } else {
                        makeup._mod(this, { hidden: true });
                    }
                });
            });
        },

        /**
         * Mode control listeners
         */
        _bindModesListeners: function() {
            var makeup = this,
                makeupElement = $(makeup._params.selectors.root),
                modeControl = $(makeup._params.selectors.modeControl),
                win = $(window),
                defaultMode;

            // Set default mode
            if (!this._state._params.hasOwnProperty('mode')) {
                defaultMode = makeup._mod(makeupElement[0]).mode || 1;
            } else {
                defaultMode = makeup._state._params.mode;
            }
            makeup._state.set({ mode: defaultMode });

            modeControl.on('change', function() {
                var value;

                modeControl.each(function(i) {
                    if (modeControl[i].checked == true) {
                        value = modeControl[i].value;
                    }
                });

                makeup._state.set({ mode: value });
            });

            win.on('keydown', function(e) {
                var key = makeup._getKey(e);

                switch (key) {
                    case 49:
                        makeup._state.set({ mode: 1 });
                        break;
                    case 50:
                        makeup._state.set({ mode: 2 });
                        break;
                    case 51:
                        makeup._state.set({ mode: 3 });
                        break;
                    case 52:
                        makeup._state.set({ mode: 4 });
                        break;
                }
            });
        },

        _setCurrentMode: function(value) {
            var modeControl = $(makeup._params.selectors.modeControl);

            if (modeControl.filter('[value="' + value + '"]')[0].checked == true) {
                return;
            }

            modeControl.each(function(i) {
                if (modeControl[i].value == value) {
                    modeControl[i].checked = true;
                }
            });
        },

        /**
         * Background control listeners
         */
        _bindBackgroundsListeners: function() {
            var makeup = this,
                makeupElement = $(makeup._params.selectors.root),
                bgControl = $(makeup._params.selectors.bgControl),
                defaultBg;

            // Set default background
            if (!this._state._params.hasOwnProperty('bg')) {
                defaultBg = makeup._mod(makeupElement[0]).bg || 'color';
            } else {
                defaultBg = makeup._state._params.bg;
            }
            makeup._state.set({ bg: defaultBg });

            bgControl.on('change', function() {
                var value;

                bgControl.each(function(i) {
                    if (bgControl[i].checked == true) {
                        value = bgControl[i].value;
                    }
                });

                makeup._state.set({ bg: value });
            });
        },

        _setCurrentBackground: function(value) {
            var bgControl = $(makeup._params.selectors.bgControl);

            if (bgControl.filter('[value="' + value + '"]')[0].checked == true) {
                return;
            }

            bgControl.each(function(i) {
                if (bgControl[i].value == value) {
                    bgControl[i].checked = true;
                }
            });
        },

        /**
         * Background control listeners
         */
        _bindTransparencyListeners: function() {
            var makeup = this,

                min = this._params.transparency.slider.min,
                max = this._params.transparency.slider.max,
                value = this._params.transparency.slider.value,

                slider = $(this._params.selectors.slider).filter('.makeup__slider--transparency'),
                sliderTrack = slider.find(this._params.selectors.sliderTrack),
                sliderTrackRunner = slider.find(this._params.selectors.sliderTrackRunner),
                sliderTrackPoint = slider.find(this._params.selectors.sliderTrackPoint);


            sliderTrack.rader({
                points: sliderTrackPoint,
                runners: sliderTrackRunner,
                runnersVal: [value],
                values: [min, max],
                pointsPos: [min, max],

                onUpdate: function(e) {
                    var value = Math.round(e.minVal * 100) / 100;

                    makeup._state.set({ transparency: value });
                }
            });
        },

        /**
         * Background control listeners
         */
        _bindZoomListeners: function() {
            var makeup = this,

                min = this._params.zoom.slider.min,
                max = this._params.zoom.slider.max,
                value = this._params.zoom.slider.value,

                slider = $(this._params.selectors.slider).filter('.makeup__slider--zoom'),
                sliderTrack = slider.find(this._params.selectors.sliderTrack),
                sliderTrackRunner = slider.find(this._params.selectors.sliderTrackRunner),
                sliderTrackPoint = slider.find(this._params.selectors.sliderTrackPoint);


            sliderTrack.rader({
                points: sliderTrackPoint,
                runners: sliderTrackRunner,
                runnersVal: [value],
                values: [min, max],
                pointsPos: [min, max],

                onUpdate: function(e) {
                    var value = Math.round(e.minVal * 100) / 100;

                    makeup._state.set({ zoom: value });
                }
            });
        },

        /**
         * Background control listeners
         */
        _bindRulerListeners: function() {
            var makeup = this,

                ruler = $(this._params.selectors.ruler),
                rulerTrack = ruler.find(this._params.selectors.rulerTrack),
                rulerTrackActive = ruler.find(this._params.selectors.rulerTrackActive),
                rulerTrackRunner = ruler.find(this._params.selectors.rulerTrackRunner),
                rulerTrackPoint = ruler.find(this._params.selectors.rulerTrackPoint),

                min = this._params.ruler.h.slider.min,
                max = this._params.ruler.h.slider.max,
                value = this._params.ruler.h.slider.value,

                horizontalRuler,
                pos = [],
                i = 0;

            while (i <= 2000) {
                pos.push(i);
                i += 100;
            }

            var updateTimeout;
            var params = this._params;
            var container = $(params.selectors.container);

            horizontalRuler = rulerTrack.rader({
                trackActive: rulerTrackActive,
                runners: rulerTrackRunner,
                points: rulerTrackPoint,
                pointsPos: pos,
                values: [min, max],
                stickingRadius: 5,
                onUpdate: function(e) {
                    container.css({
                        width: validateRangeValue(e.maxVal.toFixed(0), params.ruler.h.slider) + 'px'
                    });
                    clearTimeout(updateTimeout);
                    updateTimeout = setTimeout(function() {
                        makeup._state.set({ width: e.maxVal.toFixed(0) });
                    }, 1000);
                }
            });

            horizontalRuler.pos(0, 0);
            horizontalRuler.pos(1, value);
        },

        _bindSmileyListeners: function() {
            var smiley = $('#makeup-smiley'),
                makeupElement = $(makeup._params.selectors.root);

            // Set default smiley value
            if (!this._state._params.hasOwnProperty('smiley')) {
                var defaultSmiley = makeup._mod(makeupElement[0]).smiley || smiley[0].checked;

                makeup._state.set({ smiley: defaultSmiley });
            }

            smiley.on('change', function() {
                makeup._state.set({ smiley: this.checked });
            });
        },

        /**
         * Sets application state from object
         *
         * @param {Object} state
         */
        _setState: function(state) {
            if (!state) {
                return;
            }

            var s = state,
                params = this._params,
                makeupElement = $(this._params.selectors.root),
                box = $(this._params.selectors.box),
                container = $(this._params.selectors.container),
                containerMarkup = $(this._params.selectors.containerMarkup);

            // Current Module
            if (s.hasOwnProperty('group')) {
                if (s.typeGroup !== undefined && s.type !== undefined) {
                    this._renderModule(+s.group, +s.module, +s.typeGroup, +s.type);
                    this._setCurrentMenuItem(s.group, s.module, s.typeGroup, s.type);
                } else {
                    this._renderModule(+s.group, +s.module);
                    this._setCurrentMenuItem(s.group, s.module);
                }
            }

            // Modes toggler
            if (s.hasOwnProperty('mode')) {
                this._setCurrentMode(s.mode);
                this._mod(makeupElement[0], {mode: s.mode});
            }

            // Background
            if (s.hasOwnProperty('bg')) {
                this._setCurrentBackground(s.bg);
                this._mod(makeupElement[0], {bg: s.bg});
            }

            // Menu toggler
            if (s.hasOwnProperty('menu')) {
                var menu = $('#makeup-menu')[0],
                    menuValue = s.menu == 'true';

                this._mod(makeupElement[0], {menu: s.menu});

                if (menu.checked !== menuValue) {
                    menu.checked = menuValue;
                }
            }

            // Transparency
            if (s.hasOwnProperty('transparency')) {
                containerMarkup.css({
                    opacity: validateRangeValue(s.transparency, params.transparency.slider)
                });
            }

            // Zoom
            if (s.hasOwnProperty('zoom')) {
                container.css({
                    transform: 'scale(' + validateRangeValue(s.zoom, params.zoom.slider) + ')'
                });
            }

            // Width
            if (s.hasOwnProperty('width')) {
                container.css({
                    width: validateRangeValue(s.width, params.ruler.h.slider) + 'px'
                });
            }

            // Smiley
            if (s.hasOwnProperty('smiley')) {
                var smiley = $('#makeup-smiley')[0],
                    smileyValue = s.smiley == 'true';

                this._mod(makeupElement[0], {smiley: s.smiley});

                if (smiley.checked != smileyValue) {
                    smiley.checked = smileyValue;
                }
            }
        },

        /**
         * Sets text on status bar
         *
         * @param {String} str text of status
         */
        _setStatus: function(str) {
            var that = this;

            $(that._params.selectors.statusBar).text(str || '');
        },

        /**
         * Render module
         */
        _renderModule: function(groupId, moduleId, typeGroupId, typeId) {
            var data = this._params.data,
                selector = this._params.selectors,
                instance = {},

                group = data[groupId],
                module = group.items[moduleId],
                typeGroup = typeGroupId !== undefined && module.items && module.items[typeGroupId],
                type = typeGroup && typeId !== undefined && typeGroup.items && typeGroup.items[typeId],

                typeFields = ['name', 'label', 'data', 'image', 'snippet'],
                moduleFields = ['name', 'label', 'documentation', 'meta', 'image', 'data', 'snippet'],

                hint;


            // Собираем данные о модуле

            _.each(moduleFields, function(item) {
                var prefix = item == 'name' || item == 'label' ? 'module' : '';
                addProperty(module, instance, item, prefix + item);
            });

            if (typeGroup && type) {
                _.each(typeFields, function(item) {
                    var prefix = item == 'name' || item == 'label' ? 'type' : '';
                    addProperty(type, instance, item, prefix + item);
                });
            }

            // Устанавливаем стили

            $(selector.container).attr('style', getStyles('wrapper'));
            $(selector.containerImage).attr('style', getStyles('image'));
            $(selector.containerMarkup).attr('style', getStyles('markup'));

            // Ищем hint для модуля/типа
            hint = type && type.hint || typeGroup && typeGroup.hint || module && module.hint || group && group.hint;
            if (hint) {
                this._setStatus(escapeHTML(trimString(hint)));
            }

            // Загружаем изображение
            if (instance.image) {
                this._loadImage(instance.image);
            }


            // Рендер модуля
            if (typeof this._params.renderModule == 'function') {
                this._params.renderModule.call(this, instance, groupId, moduleId, typeGroupId, typeId);
            }


            // Сниппет
            snippet.call(this, group);
            snippet.call(this, module);
            snippet.call(this, typeGroup);
            snippet.call(this, type);


            /**
             * Скопировать свойство из одного объекта в другой
             *
             * @param {object} source Исходный объект
             * @param {object} target Целевой объект
             * @param {string} sourceKey Ключ свойства в исходном объекте
             * @param {string} targetKey Ключ свойства в целевом объекте
             */
            function addProperty(source, target, sourceKey, targetKey) {
                if (!targetKey) targetKey = sourceKey;
                if (source && source.hasOwnProperty(sourceKey)) {
                    if (typeof source[sourceKey] == 'object') {
                        target[targetKey] = _.clone(source[sourceKey]);
                    } else {
                        target[targetKey] = source[sourceKey];
                    }
                }
            }

            /**
             * Получить стили из конфига
             *
             * @param {string} Ключ (wrapper|image|markup)
             */
            function getStyles(key) {

                /**
                 * Получить стили из указанного источника
                 *
                 * @param {Object} Объект-источник (group|module|typeGroup|group)
                 * @param {String} Тип стилей (wrapper|image|markup)
                 */
                function getStylesLevel(obj, key) {
                    var styles = obj && obj.styles && obj.styles[key];

                    return styles ? styles + ';' : '';
                }

                return '' +
                    getStylesLevel(group, key) +
                    getStylesLevel(module, key) +
                    getStylesLevel(typeGroup, key) +
                    getStylesLevel(type, key);
            }

            /**
             * Call snippet
             *
             * @param {object} module
             */
            function snippet(module) {
                if (module && module.hasOwnProperty('snippet')) {
                    if (typeof module.snippet == 'function') {
                        module.snippet.call(this, instance, groupId, moduleId, typeGroupId, typeId);
                    }
                }
            }
        },

        /**
         * Загрузка изображения
         *
         * @param {string} src URL изображения
         */
        _loadImage: function(src) {
            var that = this,
                img = new Image(),
                selectors = that._params.selectors,
                container = selectors.containerImage,
                imageClass = selectors.containerImageRegular.slice(1);

            $(container).empty();
            this.imageLoader = null;

            img.onload = img.onerror = this.imageLoader = function(e) {
                img.onload = img.onerror = this.imageLoader = null;

                if (e.type == 'load') {
                    $(container).empty();
                    $(this)
                        .css({
                            width: img.width,
                            height: img.height
                        })
                        .addClass(imageClass)
                        .appendTo(container);

                    that._invertImage(img);
                }
            };

            img.src = src;
        },

        /**
         * Строим инвертированное изображение
         *
         * @param {image} img изображение
         */
        _invertImage: function(img) {
            var canvas = document.createElement('canvas'),
                selectors = this._params.selectors,
                canvasClass = selectors.containerImageInverse.slice(1);

            canvas.width = img.width;
            canvas.height = img.height;

            if (typeof canvas['getContext'] != 'undefined') {
                var ctx = canvas.getContext('2d'),
                    imageData,
                    pixels, r, g, b;

                ctx.drawImage(img, 0, 0);

                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
                pixels = imageData.data;

                for (var i = 0, il = pixels.length; i < il; i += 4) {
                    pixels[i] = 255 - pixels[i];
                    pixels[i + 1] = 255 - pixels[i + 1];
                    pixels[i + 2] = 255 - pixels[i + 2];
                }

                ctx.putImageData(imageData, 0, 0);
            }

            $(canvas)
                .addClass(canvasClass)
                .appendTo(selectors.containerImage);
        },

        /**
         * View model
         *
         * @param {object} data
         */
        _viewModel: function(data) {
            var model = data || {},
                out = model,
                that = this;

            if (model && model.data) {
                if (model.data instanceof Array) {
                    out.data = _.map(model.data, function(item, i) {
                        return {
                            label: item.label || 'Untitled group',
                            snippet: typeof item.snippet == 'function' ? item.snippet : undefined,
                            items: that._parseCollection(item.items)
                        };
                    });
                } else {
                    var item = model.data;

                    out.data = [{
                        label: item.label || 'Blocks',
                        snippet: typeof item.snippet == 'function' ? item.snippet : undefined,
                        items: that._parseCollection(item.items)
                    }];
                }
            }

            return out;
        },

        /**
         * Parse item
         *
         * @param {Object|String} item
         * @returns {Object}
         */
        _parseItem: function(item) {
            var out = {},
                untitled = 'Untitled';


            if (typeof item == 'string') {
                out.name = item || untitled;
            } else if (item instanceof Object) {
                var children = item.items || item.types,
                    documentation = item.documentation,
                    snippet = item.snippet,
                    meta = item.meta;

                out = item;

                if (typeof out.name != "undefined") {
                    out.name = String(out.name) || untitled;
                } else {
                    out.name = untitled;
                }

                // Documentation
                if (documentation) {
                    if (documentation instanceof Array && documentation.length) {
                        out.documentation = this._parseCollection(documentation, this._parseDocumentation);
                    } else if (typeof documentation == 'string' || documentation instanceof Object) {
                        out.documentation = [this._parseDocumentation(documentation)];
                    }
                }

                // Snippet
                if (snippet && typeof snippet == 'function') {
                    out.snippet = snippet;
                }

                // Meta
                if (item.meta && item.meta instanceof Array && item.meta.length) {
                    out.meta = this._parseCollection(meta, this._parseMeta);
                }

                // Children
                if (children && children instanceof Array && children.length) {
                    out.items = this._parseCollection(children);
                }
            }

            if (!out.name || out.name == '') {
                out.name = untitled;
            }

            out.label = out.label || out.name || untitled;

            return out;
        },

        /**
         * Parse collection
         */
        _parseCollection: function(arr, func) {
            var out = [],
                that = this;

            _(arr).compact().each(function(item) {
                out.push(func ? func(item) : that._parseItem(item));
            });

            return out;
        },

        /**
         * Parse documentation
         */
        _parseDocumentation: function(item) {
            var out = { link: '', label: '' };

            if (typeof item == 'string') {
                out.link = out.label = item;
            } else if (item instanceof Object && item.link) {
                out.link = item.link;
                out.label = item.label || out.link;

                if (item.modifier) {
                    out.modifier = item.modifier;
                }
            }

            return out;
        },

        /**
         * Parse meta
         */
        _parseMeta: function(item) {
            var out = {};

            if (typeof item == 'string') {
                out.key = item;
            } else if (item instanceof Object && item.key) {
                out = item;
            }

            return out;
        },

        /**
         * Returns keyCode if target is not input
         *
         * @param {Event} e Keyboard event
         */
        _getKey: function(e) {
            var key = e.which || e.keyCode,
                node = e.target.nodeName.toLowerCase(),
                contenteditable = !!e.target.attributes.contenteditable;

            if (node != 'input' && node != 'textarea' && node != 'select' && !contenteditable) {
                return key;
            }

            return false;
        }
    };

    /**
     * @param {string} str
     * @returns {string}
     */
    function trimString(str) {
        return str.replace(/^\s+|\s+$/g, '');
    }

    /**
     * @param {string} re
     * @returns {string}
     */
    function escapeRegExp(re) {
        return re.replace(/([?!\.{}[+\-\]^|$(=:)\/\\*])/g, '\\$1');
    }

    /**
     * @param {string} str
     * @returns {string}
     */
    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /**
     * @param {string} str
     * @returns {string}
     */
    function stripTags(str) {
        return str.replace(/<[^>]+>/g, '');
    }

    if (typeof TEST != 'undefined' && TEST) {
        module.exports = Makeup.prototype;
    }

    return Makeup;
})();
