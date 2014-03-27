define(function(require) {
    'use strict';

    var ItemSizeCollection = require('wf-js-uicomponents/layouts/ItemSizeCollection');

    describe('ItemSizeCollection', function() {
        function createItemSizeCollection(items) {
            return new ItemSizeCollection({
                maxWidth: 400,
                maxHeight: 300,
                items: items
            });
        }
        it('should require a maxWidth', function() {
            expect(function() {
                return new ItemSizeCollection();
            }).toThrow('ItemSizeCollection configuration: maxWidth is required.');
        });
        it('should require a maxHeight', function() {
            expect(function() {
                return new ItemSizeCollection({ maxWidth: 42 });
            }).toThrow('ItemSizeCollection configuration: maxHeight is required.');
        });
        describe('properties', function() {
            it('should get an item by index', function() {
                var item1 = {};
                var item2 = {};
                var collection = createItemSizeCollection([item1, item2]);
                expect(collection.getItem(0)).toBe(item1);
                expect(collection.getItem(1)).toBe(item2);
            });
            it('should get the length of the collection', function() {
                var collection = createItemSizeCollection([{}, {}]);
                expect(collection.getLength()).toBe(2);
            });
        });
        describe('constraining sizes', function() {
            it('should constrain sizes to fit the configured maximum width', function() {
                var collection = createItemSizeCollection();
                var tooWide = { width: collection.maxWidth * 2, height: collection.maxHeight };
                collection.constrain([tooWide]);
                expect(tooWide.width).toBe(collection.maxWidth);
                expect(tooWide.height).toBe(collection.maxHeight / 2);
            });
            it('should constrain sizes to fit the configured maximum height', function() {
                var collection = createItemSizeCollection();
                var tooHigh = { width: collection.maxWidth, height: collection.maxHeight * 2 };
                collection.constrain([tooHigh]);
                expect(tooHigh.height).toBe(collection.maxHeight);
                expect(tooHigh.width).toBe(collection.maxWidth / 2);
            });
        });
        describe('inserting items', function() {
            it('should insert the items at the specified index', function() {
                var collection = createItemSizeCollection([{}, {}]);
                var item = {};
                collection.insert(1, item);
                expect(collection.getLength()).toBe(3);
                expect(collection.getItem(1)).toBe(item);
            });
        });
    });
});
