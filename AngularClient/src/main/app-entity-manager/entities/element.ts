﻿import { EntityBase } from "./entity-base";
import { ResourcePool } from "./resource-pool";
import { ElementField, ElementFieldDataType } from "./element-field";
import { ElementItem } from "./element-item";

export class Element extends EntityBase {

    // Public - Server-side
    Id: number = 0;
    ResourcePool: ResourcePool;
    Name: string = "";

    get IsMainElement(): boolean {
        return this.fields.IsMainElement;
    }
    set IsMainElement(value: boolean) {

        if (this.fields.IsMainElement !== value) {
            this.fields.IsMainElement = value;

            if (this.initialized) {

                // Main element check: If there is another element that its IsMainElement flag is true, make it false
                if (value) {
                    this.ResourcePool.ElementSet.forEach((element) => {
                        if (element !== this && element.IsMainElement) {
                            element.IsMainElement = false;
                        }
                    });

                    // Update selectedElement of resourcePool
                    this.ResourcePool.selectedElement(this);
                }
            }
        }
    }
    ElementFieldSet: ElementField[];
    ElementItemSet: ElementItem[];
    ParentFieldSet: ElementField[];

    private fields: {
        // Server-side
        IsMainElement: boolean,

        // Client-side
        parent: Element,
        familyTree: Element[],
        elementFieldIndexSet: ElementField[],
        indexRating: number,
        directIncomeField: ElementField,
        multiplierField: ElementField,
        totalResourcePoolAmount: number
    } = {
        // Server-side
        IsMainElement: false,

        // Client-side
        parent: null,
        familyTree: null,
        elementFieldIndexSet: null,
        indexRating: null,
        directIncomeField: null,
        multiplierField: null,
        totalResourcePoolAmount: null
    };

    directIncome() {

        // TODO Check totalIncome notes

        var value = 0;
        this.ElementItemSet.forEach((item: ElementItem) => {
            value += item.directIncome();
        });

        return value;
    }

    directIncomeField() {

        // TODO In case of add / remove fields?
        if (this.fields.directIncomeField === null) {
            this.setDirectIncomeField();
        }

        return this.fields.directIncomeField;
    }

    directIncomeIncludingResourcePoolAmount() {

        // TODO Check totalIncome notes

        var value = 0;
        this.ElementItemSet.forEach((item) => {
            value += item.directIncomeIncludingResourcePoolAmount();
        });

        return value;
    }

    elementFieldIndexSet(): ElementField[] {
        if (this.fields.elementFieldIndexSet === null) {
            this.setElementFieldIndexSet();
        }
        return this.fields.elementFieldIndexSet;
    }

    familyTree() {

        // TODO In case of add / remove elements?
        if (this.fields.familyTree === null) {
            this.setFamilyTree();
        }

        return this.fields.familyTree;
    }

    // UI related: Determines whether the chart & element details will use full row (col-md-4 vs col-md-12 etc.)
    // TODO Obsolete for the moment!
    fullSize() {
        return (this.ElementFieldSet.length > 4) || this.elementFieldIndexSet().length > 2;
    }

    getElementFieldIndexSet(element: Element) {

        var sortedElementFieldSet = element.getElementFieldSetSorted();
        var indexSet: ElementField[] = [];

        // Validate
        sortedElementFieldSet.forEach((field) => {
            if (field.IndexEnabled) {
                indexSet.push(field);
            }

            if (field.DataType === ElementFieldDataType.Element && field.SelectedElement !== null) {
                var childIndexSet = this.getElementFieldIndexSet(field.SelectedElement);

                childIndexSet.forEach((childIndex) => {
                    indexSet.push(childIndex);
                });
            }
        });

        return indexSet;
    }

    getElementFieldSetSorted(): ElementField[] {
        return this.ElementFieldSet.sort((a, b) => a.SortOrder - b.SortOrder);
    }

    getElementItemSet(sort?: string): ElementItem[] {
        sort = typeof sort !== "undefined" ? sort : "";

        return this.ElementItemSet.sort((a, b) => {
            switch (sort) {
                case "totalIncome": {
                    return b.totalIncome() - a.totalIncome();
                }
                case "name":
                default: {
                    let nameA = a.Name.toLowerCase(), nameB = b.Name.toLowerCase();
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    return 0;
                }
            }
        });
    }

    indexRating() {

        if (this.fields.indexRating === null) {
            this.setIndexRating(false);
        }

        return this.fields.indexRating;
    }

    multiplier() {

        // TODO Check totalIncome notes

        var value = 0;
        this.ElementItemSet.forEach((item) => {
            value += item.multiplier();
        });

        return value;
    }

    multiplierField() {

        // TODO In case of add / remove field?
        if (this.fields.multiplierField === null) {
            this.setMultiplierField();
        }

        return this.fields.multiplierField;
    }

    parent() {

        // TODO In case of add / remove elements?
        if (this.fields.parent === null) {
            this.setParent();
        }

        return this.fields.parent;
    }

    rejectChanges(): void {
        this.entityAspect.rejectChanges();
    }

    remove() {

        // Remove from selectedElement
        if (this.ResourcePool.selectedElement() === this) {
            this.ResourcePool.selectedElement(null);
        }

        // Related items
        var elementItemSet = this.ElementItemSet.slice();
        elementItemSet.forEach((elementItem) => {
            elementItem.remove();
        });

        // Related fields
        var elementFieldSet = this.ElementFieldSet.slice();
        elementFieldSet.forEach((elementField) => {
            elementField.remove();
        });

        this.entityAspect.setDeleted();
    }

    resourcePoolAmount() {

        // TODO Check totalIncome notes

        var value = 0;
        this.ElementItemSet.forEach((item) => {
            value += item.resourcePoolAmount();
        });

        return value;
    }

    setDirectIncomeField() {
        var result = this.ElementFieldSet.filter((field) => field.DataType === ElementFieldDataType.DirectIncome);

        if (result.length > 0) {
            this.fields.directIncomeField = result[0];
        }
    }

    setElementFieldIndexSet() {
        this.fields.elementFieldIndexSet = this.getElementFieldIndexSet(this);
    }

    setFamilyTree() {

        this.fields.familyTree = [];

        var element = this as Element; // TODO: ?
        while (element !== null) {
            this.fields.familyTree.unshift(element);
            element = element.parent();
        }

        // TODO At the moment it's only upwards, later include children?
    }

    setIndexRating(updateRelated?: boolean) {
        updateRelated = typeof updateRelated === "undefined" ? true : updateRelated;

        var indexSet = this.elementFieldIndexSet();

        var value = 0;
        indexSet.forEach((index) => {
            value += index.indexRating();
        });

        if (this.fields.indexRating !== value) {
            this.fields.indexRating = value;

            // Update related
            if (updateRelated) {
                this.elementFieldIndexSet().forEach((index) => {
                    index.setIndexRatingPercentage();
                });
            }
        }
    }

    setMultiplierField() {
        var result = this.ElementFieldSet.filter((field) => field.DataType === ElementFieldDataType.Multiplier);

        if (result.length > 0) {
            this.fields.multiplierField = result[0];
        }
    }

    setParent() {
        if (this.ParentFieldSet.length > 0) {
            this.fields.parent = this.ParentFieldSet[0].Element;
        }
    }

    totalDirectIncome() {

        // TODO Check totalIncome notes

        var value = 0;
        this.ElementItemSet.forEach((item) => {
            value += item.totalDirectIncome();
        });

        return value;
    }

    totalDirectIncomeIncludingResourcePoolAmount() {

        // TODO Check totalIncome notes

        var value = 0;
        this.ElementItemSet.forEach((item) => {
            value += item.totalDirectIncomeIncludingResourcePoolAmount();
        });

        return value;
    }

    totalIncome() {

        // TODO If elementItems could set their parent element's totalIncome when their totalIncome changes, it wouldn't be necessary to sum this result everytime?

        var value = 0;
        this.ElementItemSet.forEach((item) => {
            value += item.totalIncome();
        });

        return value;
    }

    totalIncomeAverage() {

        // Validate
        if (this.ElementItemSet.length === 0) {
            return 0;
        }

        return this.totalIncome() / this.ElementItemSet.length;
    }

    // TODO This is out of pattern!
    totalResourcePoolAmount() {

        //console.log("res", this.resourcePool);

        // TODO Check totalIncome notes

        var value: number;

        if (this === this.ResourcePool.mainElement()) {

            value = this.ResourcePool.InitialValue;

            this.ElementItemSet.forEach((item) => {
                value += item.totalResourcePoolAmount();
            });

        } else {
            if (this.ResourcePool.mainElement() !== null) {
                value = this.ResourcePool.mainElement().totalResourcePoolAmount();
            }
        }

        //console.log("TRPA-A " + value.toFixed(2));

        if (this.fields.totalResourcePoolAmount !== value) {
            this.fields.totalResourcePoolAmount = value;

            //console.log("TRPA-B " + value.toFixed(2));

            this.elementFieldIndexSet().forEach((field) => {
                // TODO How about this check?
                // if (field.DataType === ElementFieldDataType.DirectIncome) { -
                field.setIndexIncome();
                // }
            });
        }

        return value;
    }
}
