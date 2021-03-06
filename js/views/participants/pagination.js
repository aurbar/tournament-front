define([
    'jquery',
    'underscore',
    'backbone',
    'resthub-handlebars',
    'backbone-paginator',
    'collections/participants',
    'text!templates/participants/pagination.html',
    'pubsub'
], function ($, _, Backbone, Handlebars, BackbonePaginator, ParticipantsCollection, paginationTemplate, Pubsub) {

    return Backbone.View.extend({

        template:Handlebars.compile(paginationTemplate),

        handlers:[],

        events:{
            "click a":"changePage"
        },

        viewType:'pagination',

        initialize:function () {

            this.handlers.push(Pubsub.subscribe(App.Events.PAGE_UP_CALLED, this.previousPage.bind(this)));
            this.handlers.push(Pubsub.subscribe(App.Events.PAGE_DOWN_CALLED, this.nextPage.bind(this)));

        },

        initBindings:function () {

        },

        render:function (collection) {
            this.collection = collection;

            this.$el.html(this.template({info:this.collection.info(), firstPage:this.collection.paginator_ui.firstPage}));

            return this;
        },

        changePage:function (event) {
            event.stopPropagation();
            event.preventDefault();

            var target = event.currentTarget;
            var pattern = "page=";
            var href = $(target).attr("href");
            var pageId = href.substring(href.indexOf(pattern) + pattern.length);
            if (pageId.indexOf("&") >= 0) {
                pageId = pageId.substring(0, pageId.indexOf("&"));
            }

            Pubsub.publish(App.Events.NEW_PAGE, [pageId]);

        },

        /**
         * switch to previous page
         *
         * @param event
         * @param selectLast boolean - true if the last element of the previous page should be selected
         */
        previousPage:function (event, selectLast) {

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (this.collection.info().previous) {
                Pubsub.publish(App.Events.NEW_PAGE, [this.collection.info().previous, selectLast]);
            }
        },

        nextPage:function (event) {

            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (this.collection.info().next) {
                Pubsub.publish(App.Events.NEW_PAGE, [this.collection.info().next]);
            }
        }

    });
});