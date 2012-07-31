define([
    'jquery',
    'underscore',
    'backbone',
    'collections/participants',
    'text!templates/participants/list.html',
    'text!templates/participants/miniature.html',
    'pubsub'
], function ($, _, Backbone, participantsCollection, participantListTemplate, participantMiniatureTemplate, Pubsub) {
    var ParticipantListView = Backbone.View.extend({

        template:_.template(participantListTemplate),
        miniatureTemplate:_.template(participantMiniatureTemplate),

        events:{
            "dragstart li.thumbnail[draggable=\"true\"]":"dragStartHandler"
            //"dragend li.thumbnail[draggable=\"true\"]":"dragEndHandler"
        },

        handlers:[],

        initialize:function () {
            this.collection = participantsCollection;
            _.bindAll(this, 'render');
            this.handlers.push(Pubsub.subscribe(Events.ELEM_DELETED_FROM_BAR, this.participantDeleted.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETIONS_CANCELED, this.cancelDeletions.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.NEXT_CALLED, this.selectNext.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.PREVIOUS_CALLED, this.selectPrevious.bind(this)));
            this.handlers.push(Pubsub.subscribe(Events.DELETE_ELEM, this.deleteParticipant.bind(this)));
        },

        render:function (idSelected) {
            this.collection.fetch(
                {
                    success:function () {
                        this.showTemplate(idSelected);
                    }.bind(this),
                    error:function () {
                        Pubsub.publish(Events.ALERT_RAISED, ['Error!', 'An error occurred while trying to fetch participants', 'alert-error']);
                    }
                });
            return this;
        },

        dragStartHandler:function (event) {
            event.originalEvent.dataTransfer.effectAllowed = 'move'; // only dropEffect='copy' will be dropable
            var id = event.currentTarget.getAttribute('id');
            event.originalEvent.dataTransfer.setData('id', id);
            event.originalEvent.dataTransfer.setData('type', 'participant');

            var participantIndex = $('#' + id).find("input[type='hidden']").get(0).value;
            var participant = this.collection.models[parseInt(participantIndex)];
            var dragIcon = $("#dragIcon");
            dragIcon.html(this.miniatureTemplate({participant:participant.toJSON(), server_url:"http://localhost:3000/api"}));
            event.originalEvent.dataTransfer.setDragImage(dragIcon.get(0), 25, 25);

            Pubsub.publish(Events.DRAG_START);
        },

        showTemplate:function (idSelected) {
            var deleted = JSON.parse(localStorage.getItem('deletedElements')).participant;
            if (!deleted) {
                deleted = [];
            }
            this.$el.html(this.template({participants:this.collection.toJSON(), server_url:'http://localhost:3000/api', deleted:deleted, 'id_selected':idSelected}));
            var $selected = this.findSelected()
            if (!$selected || $selected.length == 0) {
                this.selectFirst();
            }
            this.handlers.push(Pubsub.publish(Events.VIEW_CHANGED, ['list']));
        },

        cancelDeletions:function () {
            var idSelected = this.findSelected().get(0).id;
            this.render(idSelected);
        },

        participantDeleted:function (id) {
            var $element = $('#' + id);

            if ($element.hasClass("selected")) {
                this.selectPrevious();
            }

            $element.remove();

            var $selected = this.findSelected();
            if (!$selected || $selected.length == 0) {
                this.selectFirst();
            }
        },

        selectNext:function () {
            var $selected = this.findSelected();

            if (!$selected || $selected.length == 0) {
                this.selectFirst();
                return;
            }

            var $toSelect = this.findNextSelect();

            if ($toSelect && $toSelect.length > 0) {
                $toSelect.addClass("selected");
                $selected.removeClass("selected");
            }

        },

        selectFirst:function () {
            this.$el.find(".thumbnails > li.thumbnail:first-child").addClass("selected");
        },

        selectPrevious:function () {
            var $selected = this.findSelected();
            var $toSelect = this.findPreviousSelect();

            if ($toSelect && $toSelect.length > 0) {
                $toSelect.addClass("selected");
                $selected.removeClass("selected");
            }
        },

        findSelected:function () {
            return this.$el.find(".thumbnails > li.thumbnail.selected");
        },

        findNextSelect:function () {
            return this.$el.find(".thumbnails > li.thumbnail.selected + li.thumbnail");
        },

        findPreviousSelect:function () {
            var previous = this.$el.find(".thumbnails > li.thumbnail.selected").get(0).previousElementSibling;
            if (previous) {
                return this.$el.find('#' + previous.id);
            }
            return null;
        },

        deleteParticipant:function () {

            var $selected = this.findSelected();
            if ($selected && $selected.length > 0) {
                this.deletedElements = JSON.parse(localStorage.getItem('deletedElements'));
                this.deletedElements['participant'].push($selected.get(0).id);
                localStorage.setItem('deletedElements', JSON.stringify(this.deletedElements));

                this.participantDeleted($selected.get(0).id);

                Pubsub.publish(Events.ELEM_DELETED_FROM_VIEW);
            }
        }

    });

    return ParticipantListView;
});