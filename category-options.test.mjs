import assert from 'node:assert/strict';
import { shopCategories, productCategories, categoriesForShop } from './shared/categories.ts';
for(const category of ['CCTV items','Power tools','Home decor','Mobilephone','Automobiles','Power inverter and solar']) { assert.ok(productCategories.includes(category));assert.ok(categoriesForShop('Electronics').includes(category));assert.ok(!categoriesForShop('Textiles').includes(category)); }
assert.ok(shopCategories.includes('Medical store'));assert.ok(shopCategories.includes('Furniture shop'));
assert.equal(new Set(productCategories).size,productCategories.length);
assert.deepEqual(categoriesForShop('Medical store'),['Medical store']);assert.deepEqual(categoriesForShop('Unknown'),[]);
console.log('Category options and shop restrictions passed.');
