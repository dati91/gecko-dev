/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* import-globals-from ../../../../../browser/extensions/formautofill/content/autofillEditForms.js*/
import LabelledCheckbox from "../components/labelled-checkbox.js";
import PaymentRequestPage from "../components/payment-request-page.js";
import PaymentStateSubscriberMixin from "../mixins/PaymentStateSubscriberMixin.js";
import paymentRequest from "../paymentRequest.js";
/* import-globals-from ../unprivileged-fallbacks.js */

/**
 * <address-form></address-form>
 *
 * Don't use document.getElementById or document.querySelector* to access form
 * elements, use querySelector on `this` or `this.form` instead so that elements
 * can be found before the element is connected.
 *
 * XXX: Bug 1446164 - This form isn't localized when used via this custom element
 * as it will be much easier to share the logic once we switch to Fluent.
 */

export default class AddressForm extends PaymentStateSubscriberMixin(PaymentRequestPage) {
  constructor() {
    super();

    this.genericErrorText = document.createElement("div");

    this.cancelButton = document.createElement("button");
    this.cancelButton.className = "cancel-button";
    this.cancelButton.addEventListener("click", this);

    this.backButton = document.createElement("button");
    this.backButton.className = "back-button";
    this.backButton.addEventListener("click", this);

    this.saveButton = document.createElement("button");
    this.saveButton.className = "save-button primary";
    this.saveButton.addEventListener("click", this);

    this.persistCheckbox = new LabelledCheckbox();
    this.persistCheckbox.className = "persist-checkbox";

    this._errorFieldMap = {
      addressLine: "#street-address",
      city: "#address-level2",
      country: "#country",
      organization: "#organization",
      phone: "#tel",
      postalCode: "#postal-code",
      // Bug 1472283 is on file to support
      // additional-name and family-name.
      recipient: "#given-name",
      region: "#address-level1",
    };

    // The markup is shared with form autofill preferences.
    let url = "formautofill/editAddress.xhtml";
    this.promiseReady = this._fetchMarkup(url).then(doc => {
      this.form = doc.getElementById("form");
      return this.form;
    });
  }

  _fetchMarkup(url) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.responseType = "document";
      xhr.addEventListener("error", reject);
      xhr.addEventListener("load", evt => {
        resolve(xhr.response);
      });
      xhr.open("GET", url);
      xhr.send();
    });
  }

  connectedCallback() {
    this.promiseReady.then(form => {
      this.body.appendChild(form);

      let record = {};
      this.formHandler = new EditAddress({
        form,
      }, record, {
        DEFAULT_REGION: PaymentDialogUtils.DEFAULT_REGION,
        getFormFormat: PaymentDialogUtils.getFormFormat,
        supportedCountries: PaymentDialogUtils.supportedCountries,
      });

      this.body.appendChild(this.persistCheckbox);
      this.body.appendChild(this.genericErrorText);

      this.footer.appendChild(this.cancelButton);
      this.footer.appendChild(this.backButton);
      this.footer.appendChild(this.saveButton);
      // Only call the connected super callback(s) once our markup is fully
      // connected, including the shared form fetched asynchronously.
      super.connectedCallback();
    });
  }

  render(state) {
    let record = {};
    let {
      page,
      "address-page": addressPage,
      request,
    } = state;

    if (this.id && page && page.id !== this.id) {
      log.debug(`AddressForm: no need to further render inactive page: ${page.id}`);
      return;
    }

    this.cancelButton.textContent = this.dataset.cancelButtonLabel;
    this.backButton.textContent = this.dataset.backButtonLabel;
    this.saveButton.textContent = this.dataset.saveButtonLabel;
    this.persistCheckbox.label = this.dataset.persistCheckboxLabel;

    this.backButton.hidden = page.onboardingWizard;
    this.cancelButton.hidden = !page.onboardingWizard;

    if (addressPage.addressFields) {
      this.setAttribute("address-fields", addressPage.addressFields);
    } else {
      this.removeAttribute("address-fields");
    }

    this.pageTitleHeading.textContent = addressPage.title;
    this.genericErrorText.textContent = page.error;

    let editing = !!addressPage.guid;
    let addresses = paymentRequest.getAddresses(state);

    // If an address is selected we want to edit it.
    if (editing) {
      record = addresses[addressPage.guid];
      if (!record) {
        throw new Error("Trying to edit a non-existing address: " + addressPage.guid);
      }
      // When editing an existing record, prevent changes to persistence
      this.persistCheckbox.hidden = true;
    } else {
      // Adding a new record: default persistence to checked when in a not-private session
      this.persistCheckbox.hidden = false;
      this.persistCheckbox.checked = !state.isPrivate;
    }

    this.formHandler.loadRecord(record);

    // Add validation to some address fields
    for (let formElement of this.form.elements) {
      let container = formElement.closest(`#${formElement.id}-container`);
      if (formElement.localName == "button" || !container) {
        continue;
      }
      let required = formElement.required && !formElement.disabled;
      if (required) {
        container.setAttribute("required", "true");
      } else {
        container.removeAttribute("required");
      }
    }

    let shippingAddressErrors = request.paymentDetails.shippingAddressErrors;
    for (let [errorName, errorSelector] of Object.entries(this._errorFieldMap)) {
      let container = this.form.querySelector(errorSelector + "-container");
      let field = this.form.querySelector(errorSelector);
      let errorText = (shippingAddressErrors && shippingAddressErrors[errorName]) || "";
      container.classList.toggle("error", !!errorText);
      field.setCustomValidity(errorText);
      let span = container.querySelector(".error-text");
      if (!span) {
        span = document.createElement("span");
        span.className = "error-text";
        container.appendChild(span);
      }
      span.textContent = errorText;
    }

    // Position the error messages all at once so layout flushes only once.
    let formRect = this.form.getBoundingClientRect();
    let errorSpanData = [...this.form.querySelectorAll(".error-text:not(:empty)")].map(span => {
      let relatedInput = span.previousElementSibling;
      let relatedRect = relatedInput.getBoundingClientRect();
      return {
        span,
        top: relatedRect.bottom,
        left: relatedRect.left - formRect.left,
        right: formRect.right - relatedRect.right,
      };
    });
    let isRTL = this.form.matches(":dir(rtl)");
    for (let data of errorSpanData) {
      // Subtract 10px for the padding-top and padding-bottom.
      data.span.style.top = (data.top - 10) + "px";
      if (isRTL) {
        data.span.style.right = data.right + "px";
      } else {
        data.span.style.left = data.left + "px";
      }
    }
  }
  handleEvent(event) {
    switch (event.type) {
      case "click": {
        this.onClick(event);
        break;
      }
    }
  }

  onClick(evt) {
    switch (evt.target) {
      case this.cancelButton: {
        paymentRequest.cancel();
        break;
      }
      case this.backButton: {
        let currentState = this.requestStore.getState();
        const previousId = currentState.page.previousId;
        let state = {
          page: {
            id: previousId || "payment-summary",
          },
        };
        if (previousId) {
          state[previousId] = Object.assign({}, currentState[previousId], {
            preserveFieldValues: true,
          });
        }
        this.requestStore.setState(state);
        break;
      }
      case this.saveButton: {
        this.saveRecord();
        break;
      }
      default: {
        throw new Error("Unexpected click target");
      }
    }
  }

  saveRecord() {
    let record = this.formHandler.buildFormObject();
    let currentState = this.requestStore.getState();
    let {
      page,
      tempAddresses,
      savedBasicCards,
      "address-page": addressPage,
    } = currentState;
    let editing = !!addressPage.guid;

    if (editing ? (addressPage.guid in tempAddresses) : !this.persistCheckbox.checked) {
      record.isTemporary = true;
    }

    let state = {
      errorStateChange: {
        page: {
          id: "address-page",
          onboardingWizard: page.onboardingWizard,
          error: this.dataset.errorGenericSave,
        },
        "address-page": addressPage,
      },
      preserveOldProperties: true,
      selectedStateKey: page.selectedStateKey,
    };

    const previousId = page.previousId;
    if (page.onboardingWizard && !Object.keys(savedBasicCards).length) {
      state.successStateChange = {
        page: {
          id: "basic-card-page",
          previousId: "address-page",
          onboardingWizard: page.onboardingWizard,
        },
      };
    } else {
      state.successStateChange = {
        page: {
          id: previousId || "payment-summary",
          onboardingWizard: page.onboardingWizard,
        },
      };
    }

    if (previousId) {
      state.successStateChange[previousId] = Object.assign({}, currentState[previousId]);
      state.successStateChange[previousId].preserveFieldValues = true;
    }

    paymentRequest.updateAutofillRecord("addresses", record, addressPage.guid, state);
  }
}

customElements.define("address-form", AddressForm);
