import Vue from "vue";
import Vuetify from "vuetify";

Vue.use(Vuetify);

import axios from "axios";
import BulkUpload from "@/views/BulkUpload.vue";

// Utilities
import { mount, createLocalVue } from "@vue/test-utils";

const localVue = createLocalVue();
document.body.setAttribute("data-app", true);

let wrapper;

jest.mock("axios");

const sampleFile = {
  name: "sample.csv",
  size: 8
};

const created = jest.fn();

function getUploadButton(wrapper) {
  return wrapper.find("#upload-button button");
}

describe("BulkUpload.vue", () => {
  let vuetify;

  beforeEach(() => {
    vuetify = new Vuetify();

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { created }
    });
  });

  it("Is a vue instance", () => {
    expect(wrapper.isVueInstance()).toBeTruthy();
  });

  it("Says bulk upload in the title", () => {
    expect(wrapper.findAll(".v-card__title")).toHaveLength(1);
    expect(wrapper.find(".v-card__title").text()).toBe("Bulk Upload");
  });

  it("Has the correct form fields", () => {
    expect(wrapper.findAll(".v-input--radio-group__input")).toHaveLength(1);
    expect(wrapper.findAll(".v-btn__content")).toHaveLength(1);
  });

  it("File input is disabled by default", () => {
    let fileInput = wrapper.find(".v-file-input");
    expect(fileInput.exists()).toBeFalsy();
  });

  it("File input is enabled when file type is selected", () => {
    wrapper.setData({ fileType: "csv" });

    let fileInput = wrapper.find(".v-file-input");
    expect(fileInput.classes()).not.toContain("v-input--is-disabled");
  });

  it("Only allows invalid file types initially", () => {
    let allowedExtension = wrapper.vm.allowedFileExtension;
    expect(allowedExtension).toBe(".invalid");
  });

  it("Allows valid file types on select", () => {
    wrapper.setData({ fileType: "csv" });

    let allowedExtension = wrapper.vm.allowedFileExtension;
    expect(allowedExtension).toBe(".csv");

    wrapper.setData({ fileType: "json" });

    allowedExtension = wrapper.vm.allowedFileExtension;
    expect(allowedExtension).toBe(".json");
  });

  it("Should have no structure definitions by default", () => {
    let structureDefinitions = wrapper.vm.structureDefinitions;
    expect(structureDefinitions).toEqual([]);
  });

  it("Should have no questionnaires by default", () => {
    let questionnaires = wrapper.vm.questionnaires;
    expect(questionnaires).toEqual([]);
  });

  it("Should populate structure definition from axios call", async () => {
    let response = {
      data: ["Structure 1", "Structure 2", "Structure 3"]
    };

    axios.get.mockImplementationOnce(() => Promise.resolve(response));
    await wrapper.vm.loadStructureDefinitions();

    let expected = [
      { text: "Structure 1", value: "Structure 1" },
      { text: "Structure 2", value: "Structure 2" },
      { text: "Structure 3", value: "Structure 3" }
    ];

    let structureDefinitions = wrapper.vm.structureDefinitions;
    expect(structureDefinitions).toEqual(expected);
  });

  it("Should not show upload instructions by default", () => {
    expect(wrapper.findAll("#instructions")).toHaveLength(0);
  });

  it("Should show instructions when field is selected", () => {
    wrapper.setData({ fileType: "json" });

    expect(wrapper.findAll("#instructions")).toHaveLength(1);

    wrapper.setData({ fileType: "csv" });
    expect(wrapper.findAll("#instructions")).toHaveLength(1);
  });

  it("Should show example button in json instructions", () => {
    wrapper.setData({ fileType: "json" });
    expect(wrapper.findAll(".v-btn__content")).toHaveLength(2);
  });

  it("Should show example button in csv instructions", () => {
    wrapper.setData({ fileType: "csv" });
    expect(wrapper.findAll(".v-btn__content")).toHaveLength(2);
  });

  it("Should not have a dialog if json is not selected", () => {
    let dialog = wrapper.find(".v-dialog");
    expect(dialog.exists()).toBeFalsy();
  });

  it("Should hide dialog by default", () => {
    wrapper.setData({ fileType: "json" });

    let dialog = wrapper.find(".v-dialog");
    let styles = dialog.attributes("style");

    expect(dialog.exists()).toBeTruthy();
    expect(styles.includes("display: none")).toBeTruthy();
  });

  it("Should open dialog when json example is clicked", () => {
    wrapper.setData({ fileType: "json" });

    let dialog = wrapper.find(".v-dialog");
    let button = wrapper.find("#instructions .v-btn__content");

    expect(button.exists()).toBeTruthy();
    button.trigger("click");

    let styles = dialog.attributes("style");

    expect(styles.includes("display: none")).toBeFalsy();
  });

  it("Should open dialog when csv example is clicked", () => {
    wrapper.setData({ fileType: "csv" });

    let dialog = wrapper.find(".v-dialog");
    let button = wrapper.find("#instructions .v-btn__content");

    expect(button.exists()).toBeTruthy();
    button.trigger("click");

    let styles = dialog.attributes("style");

    expect(styles.includes("display: none")).toBeFalsy();
  });

  it("Should not show json text area if json is not selected", () => {
    let textarea = wrapper.find("textarea");
    expect(textarea.exists()).toBeFalsy();
  });

  it("Should show json text area if json is selected", () => {
    wrapper.setData({ fileType: "json" });

    let textarea = wrapper.find("textarea");
    expect(textarea.exists()).toBeTruthy();
  });

  it("Should not show json text area if csv is selected", () => {
    wrapper.setData({ fileType: "csv" });

    let textarea = wrapper.find("textarea");
    expect(textarea.exists()).toBeFalsy();
  });

  it("Should not show structure definition field by default", () => {
    let input = wrapper.find("#structure-definition-field");

    expect(input.exists()).toBeFalsy();
  });

  it("Should not show structure definition field if csv is selected", () => {
    wrapper.setData({ fileType: "csv" });
    let input = wrapper.find("#structure-definition-field");

    expect(input.exists()).toBeFalsy();
  });

  it("Should show structure definition field if csv is selected", () => {
    wrapper.setData({ fileType: "json" });
    let input = wrapper.find("#structure-definition-field");

    expect(input.exists()).toBeTruthy();
  });

  it("Should not show file uploading by default", () => {
    expect(wrapper.vm.upload).toBeFalsy();
  });

  it("Should show file uploading when new file is added", () => {
    wrapper.setData({ fileType: "json" });

    let fileInput = wrapper.find('input[type="file"]');

    expect(fileInput.exists()).toBeTruthy();

    const fileReaderSpy = jest
      .spyOn(FileReader.prototype, "readAsText")
      .mockImplementation(() => null);
    fileInput.trigger("change");

    expect(wrapper.vm.upload).toBeTruthy();
    expect(fileReaderSpy).toBeCalled();
  });

  it("Should not upload by default", () => {
    wrapper.setData({ upload: false });

    let upload = wrapper.vm.fileUploadStatus;
    expect(upload).toBeFalsy();
  });

  it("Should show false if upload is not set", () => {
    wrapper.setData({ upload: false });

    let upload = wrapper.vm.fileUploadStatus;
    expect(upload).toBeFalsy();
  });

  it("Should show primary if upload is set", () => {
    wrapper.setData({ upload: true });

    let upload = wrapper.vm.fileUploadStatus;
    expect(upload).toBe("primary");
  });

  it("Should show different no text messages for structure definition onload from error", () => {
    let message = wrapper.vm.noStructureDefinitions;

    wrapper.setData({ downloadedStructureDefinitions: true });

    let newMessage = wrapper.vm.noStructureDefinitions;

    expect(message).not.toEqual(newMessage);
  });

  it("Should show different no text messages for questionnaires onload from error", () => {
    let message = wrapper.vm.noQuestionnaires;

    wrapper.setData({ downloadedQuestionnaires: true });

    let newMessage = wrapper.vm.noQuestionnaires;

    expect(message).not.toEqual(newMessage);
  });

  it("Should not show questionnaire field by default", () => {
    let input = wrapper.find("#questionnaire-field");

    expect(input.exists()).toBeFalsy();
  });

  it("Should not show questionnaire field if json is selected", () => {
    wrapper.setData({ fileType: "json" });
    let input = wrapper.find("#questionnaire-field");

    expect(input.exists()).toBeFalsy();
  });

  it("Should show questionnaire field if csv is selected", () => {
    wrapper.setData({ fileType: "csv" });
    let input = wrapper.find("#questionnaire-field");

    expect(input.exists()).toBeTruthy();
  });

  it("Should populate questionnaire from axios call", async () => {
    let response = {
      data: [
        { resource: { id: 1, name: "Questionnaire 1" } },
        { resource: { id: 2, name: "Questionnaire 2" } }
      ]
    };

    axios.get.mockImplementationOnce(() => Promise.resolve(response));
    await wrapper.vm.loadQuestionnaires();

    let expected = [
      { text: "Questionnaire 1", value: 1 },
      { text: "Questionnaire 2", value: 2 }
    ];

    let questionnaires = wrapper.vm.questionnaires;
    expect(questionnaires).toEqual(expected);
  });

  it("Should populate questionnaire with name and title", async () => {
    let response = {
      data: [
        { resource: { id: 1, name: "Questionnaire 1", title: "Not correct" } },
        { resource: { id: 2, title: "Questionnaire 2" } }
      ]
    };

    axios.get.mockImplementationOnce(() => Promise.resolve(response));
    await wrapper.vm.loadQuestionnaires();

    let expected = [
      { text: "Questionnaire 1", value: 1 },
      { text: "Questionnaire 2", value: 2 }
    ];

    let questionnaires = wrapper.vm.questionnaires;
    expect(questionnaires).toEqual(expected);
  });

  it("Should populate questionnaire with id if name and title aren't provided", async () => {
    let response = {
      data: [
        { resource: { id: 1, name: "Questionnaire 1" } },
        { resource: { id: 2, name: "Questionnaire 2" } },
        { resource: { id: 3 } }
      ]
    };

    axios.get.mockImplementationOnce(() => Promise.resolve(response));
    await wrapper.vm.loadQuestionnaires();

    let expected = [
      { text: "Questionnaire 1", value: 1 },
      { text: "Questionnaire 2", value: 2 },
      { text: 3, value: 3 }
    ];

    let questionnaires = wrapper.vm.questionnaires;
    expect(questionnaires).toEqual(expected);
  });

  it("Should not show any error messages by default", () => {
    let errorMessage = wrapper.find("#file-type .error--text");
    expect(errorMessage.exists()).toBeFalsy();
  });

  it("Should fail to validate form when nothing is selected", () => {
    let valid = wrapper.vm.formIsValid();
    expect(valid).toBeFalsy();
  });

  it("Should only have one error message when empty form is submitted", () => {
    wrapper.vm.formIsValid();

    let errorMessages = wrapper.findAll(".v-messages.error--text");
    expect(errorMessages).toHaveLength(1);
  });

  it("Should not show error message on questionnaire if json is selected", () => {
    wrapper.setData({ fileType: "json" });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#questionnaire-field .error--text");
    expect(errorMessage.exists()).toBeFalsy();
  });

  it("Should not show error message on structure definition if csv is selected", () => {
    wrapper.setData({ fileType: "csv" });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#structure-definition-field .error--text");
    expect(errorMessage.exists()).toBeFalsy();
  });

  it("Should not show error message on JSON blob if csv is selected", () => {
    wrapper.setData({ fileType: "csv" });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#json-blob .error--text");
    expect(errorMessage.exists()).toBeFalsy();
  });

  it("Should show error message if file is not selected", () => {
    wrapper.setData({ fileType: "csv" });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#file-upload .error--text");
    expect(errorMessage.exists()).toBeTruthy();

    wrapper.setData({ fileType: "json" });

    valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    errorMessage = wrapper.find("#file-upload .error--text");
    expect(errorMessage.exists()).toBeTruthy();
  });

  it("Should not show error message for json if blob is selected but no file is selected", () => {
    wrapper.setData({ fileType: "json" });
    wrapper.setData({ jsonBlob: "something" });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#file-upload .error--text");
    expect(errorMessage.exists()).toBeFalsy();

    errorMessage = wrapper.find("#json-blob .error--text");
    expect(errorMessage.exists()).toBeFalsy();
  });

  it("Should show error message for json if file is uploaded but no blob is entered", () => {
    wrapper.setData({ fileType: "json" });
    wrapper.setData({ filePath: sampleFile });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#file-upload .error--text");
    expect(errorMessage.exists()).toBeTruthy();

    errorMessage = wrapper.find("#json-blob .error--text");
    expect(errorMessage.exists()).toBeFalsy();
  });

  it("Should show error message for questionnaire if csv is selected", () => {
    wrapper.setData({ fileType: "csv" });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#questionnaire-field .error--text");
    expect(errorMessage.exists()).toBeTruthy();
  });

  it("Should show error message for structure definition if json is selected", () => {
    wrapper.setData({ fileType: "json" });

    let valid = wrapper.vm.formIsValid();

    expect(valid).toBeFalsy();

    let errorMessage = wrapper.find("#structure-definition-field .error--text");
    expect(errorMessage.exists()).toBeTruthy();
  });

  it("Should validate csv fields", () => {
    wrapper.setData({ fileType: "csv" });
    wrapper.setData({ questionnaire: "questionnaire" });
    wrapper.setData({ fileData: "path" });
    wrapper.setData({ filePath: sampleFile });

    let valid = wrapper.vm.formIsValid();
    expect(valid).toBeTruthy();
  });

  it("Should validate json if file and structure definition are set", () => {
    wrapper.setData({ fileType: "json" });
    wrapper.setData({ filePath: sampleFile });
    wrapper.setData({ structureDefinition: "definition" });
    wrapper.setData({ fileData: "data" });

    let valid = wrapper.vm.formIsValid();
    expect(valid).toBeTruthy();
  });

  it("Should validate json if blob and structure definition are set", () => {
    wrapper.setData({ fileType: "json" });
    wrapper.setData({ structureDefinition: "definition" });
    wrapper.setData({ jsonBlob: "blob" });

    let valid = wrapper.vm.formIsValid();
    expect(valid).toBeTruthy();
  });

  it("Should have no instructions if no fileType is set", () => {
    let instructions = wrapper.vm.uploadInstructions;
    expect(instructions).toBe("");
  });

  it("Should have no instructions if invalid fileType is set", () => {
    wrapper.setData({ fileType: "invalid" });

    let instructions = wrapper.vm.uploadInstructions;
    expect(instructions).toBe("");
  });

  it("Should have different instructions for json and csv", () => {
    wrapper.setData({ fileType: "json" });

    let jsonInstructions = wrapper.vm.uploadInstructions;

    wrapper.setData({ fileType: "csv" });

    let csvInstructions = wrapper.vm.uploadInstructions;

    expect(jsonInstructions).not.toBe("");
    expect(csvInstructions).not.toBe("");
    expect(jsonInstructions).not.toBe(csvInstructions);
  });

  it("Should have no dialog text if no fileType is set", () => {
    let text = wrapper.vm.dialogText;
    expect(text).toBe("");
  });

  it("Should have no dialog text if invalid fileType is set", () => {
    wrapper.setData({ fileType: "invalid" });

    let text = wrapper.vm.dialogText;
    expect(text).toBe("");
  });

  it("Should have different dialog text for json and csv", () => {
    wrapper.setData({ fileType: "json" });

    let jsonText = wrapper.vm.dialogText;
    expect(jsonText).not.toBe("");

    wrapper.setData({ fileType: "csv" });

    let csvText = wrapper.vm.dialogText;
    expect(csvText).not.toBe("");

    expect(jsonText).not.toBe(csvText);
  });

  it("Should have no dialog title if no fileType is set", () => {
    let title = wrapper.vm.dialogTitle;
    expect(title).toBe("");
  });

  it("Should have no dialog title if invalid fileType is set", () => {
    wrapper.setData({ fileType: "invalid" });

    let title = wrapper.vm.dialogTitle;
    expect(title).toBe("");
  });

  it("Should have different dialog titles for json and csv", () => {
    wrapper.setData({ fileType: "json" });

    let jsonTitle = wrapper.vm.dialogTitle;
    expect(jsonTitle).not.toBe("");

    wrapper.setData({ fileType: "csv" });

    let csvTitle = wrapper.vm.dialogTitle;
    expect(csvTitle).not.toBe("");

    expect(jsonTitle).not.toBe(csvTitle);
  });

  it("Returns false for formatting if csv but no file data", () => {
    wrapper.setData({ fileType: "csv" });

    let data = wrapper.vm.formatData();
    expect(data).toBeFalsy();
  });

  it("Skips blank lines for csv formatting", () => {
    wrapper.setData({ fileType: "csv" });
    wrapper.setData({ fileData: "a,b,c,d\ne,f,g,h\ni,j,k,l\n\nm,n,o,p" });
    wrapper.setData({ questionnaire: "questionnaire" });

    let data = wrapper.vm.formatData();
    let expected = {
      questionnaire: "questionnaire",
      responses: [
        { a: "e", b: "f", c: "g", d: "h" },
        { a: "i", b: "j", c: "k", d: "l" },
        { a: "m", b: "n", c: "o", d: "p" }
      ]
    };

    expect(data).toEqual(expected);
  });

  it("Correctly parses and formats csv file", () => {
    wrapper.setData({ fileType: "csv" });
    wrapper.setData({ fileData: "a,b,c,d\ne,f,g,h\ni,j,k,l\nm,n,o,p" });
    wrapper.setData({ questionnaire: "questionnaire" });

    let data = wrapper.vm.formatData();
    let expected = {
      questionnaire: "questionnaire",
      responses: [
        { a: "e", b: "f", c: "g", d: "h" },
        { a: "i", b: "j", c: "k", d: "l" },
        { a: "m", b: "n", c: "o", d: "p" }
      ]
    };

    expect(data).toEqual(expected);
  });

  it("Returns false for formatting if json blob and file data aren’t set", () => {
    wrapper.setData({ fileType: "json" });

    let data = wrapper.vm.formatData();
    expect(data).toBeFalsy();
  });

  it("Uses json blob over file data for formatting when both exist", () => {
    wrapper.setData({ fileType: "json" });
    wrapper.setData({ jsonBlob: "blob" });
    wrapper.setData({ structureDefinition: "definition" });
    wrapper.setData({ fileData: "file data" });

    let data = wrapper.vm.formatData();
    let expected = {
      bundle: "blob",
      definition: "definition"
    };

    expect(data).toEqual(expected);
  });

  it("Uses file data for json formatting if blob does not exist", () => {
    wrapper.setData({ fileType: "json" });
    wrapper.setData({ structureDefinition: "definition" });
    wrapper.setData({ fileData: "file data" });

    let data = wrapper.vm.formatData();
    let expected = {
      bundle: "file data",
      definition: "definition"
    };

    expect(data).toEqual(expected);
  });

  it("Returns false for formatting if file type is invalid", () => {
    wrapper.setData({ fileType: "invalid" });
    wrapper.setData({ jsonBlob: "blob" });
    wrapper.setData({ structureDefinition: "definition" });
    wrapper.setData({ fileData: "file data" });
    wrapper.setData({ questionnaire: "questionnaire" });

    let data = wrapper.vm.formatData();
    expect(data).toBeFalsy();
  });

  test("Submit returns false if data is not set", () => {
    let formatData = jest.fn();
    formatData.mockReturnValue(false);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { created, formatData }
    });

    let response = wrapper.vm.submit();
    expect(response).toBeFalsy();
  });

  test("Submit returns false if route is not set", () => {
    let formatData = jest.fn();
    let uploadRoute = jest.fn();

    formatData.mockReturnValue({ bundle: "bundle", definition: "definition" });
    uploadRoute.mockReturnValue(false);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { created, formatData, uploadRoute }
    });

    let response = wrapper.vm.submit();
    expect(response).toBeFalsy();
  });

  test("Upload route returns false if not csv or json", () => {
    wrapper.setData({ fileType: "invalid" });

    let route = wrapper.vm.uploadRoute();
    expect(route).toBeFalsy();
  });

  test("Upload route returns different routes for csv and json", () => {
    wrapper.setData({ fileType: "csv" });

    let csvRoute = wrapper.vm.uploadRoute();
    expect(csvRoute).not.toBe("");

    wrapper.setData({ fileType: "json" });

    let jsonRoute = wrapper.vm.uploadRoute();
    expect(jsonRoute).not.toBe("");

    expect(jsonRoute).not.toBe(csvRoute);
  });

  test("Validate and send returns false if form is not valid", () => {
    let formIsValid = jest.fn();
    formIsValid.mockReturnValue(false);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { created, formIsValid }
    });

    let response = wrapper.vm.validateAndSend();
    expect(response).toBeFalsy();
  });

  test("Validate and send returns result of submit if form is valid", () => {
    let formIsValid = jest.fn();
    formIsValid.mockReturnValue(true);

    let submit = jest.fn();
    submit.mockReturnValue("asdjfkl");

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { created, formIsValid, submit }
    });

    let response = wrapper.vm.validateAndSend();
    expect(response).toBe("asdjfkl");
  });

  test("Alert is hidden by default", () => {
    let alertComponent = wrapper.find(".v-alert");
    expect(alertComponent.exists()).toBeFalsy();
  });

  test("Alert is shown when alert data is set", () => {
    wrapper.setData({ showAlert: true });

    let alertComponent = wrapper.find(".v-alert");
    expect(alertComponent.exists()).toBeTruthy();
  });

  test("Success message shown after successful post", async () => {
    let response = {
      success: true,
      count: 5
    };

    let formatData = jest.fn();
    formatData.mockReturnValue(true);

    let uploadRoute = jest.fn();
    uploadRoute.mockReturnValue(true);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { created, formatData, uploadRoute }
    });

    axios.post.mockImplementationOnce(() => Promise.resolve(response));

    await wrapper.vm.submit();

    let showAlert = wrapper.vm.showAlert;
    let alertComponent = wrapper.find(".v-alert");

    expect(showAlert).toBeTruthy();
    expect(alertComponent.exists()).toBeTruthy();
  });

  test("Error message shown after failed post", async () => {
    let response = {
      success: true,
      count: 5
    };

    let formatData = jest.fn();
    formatData.mockReturnValue(true);

    let uploadRoute = jest.fn();
    uploadRoute.mockReturnValue(true);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { formatData, uploadRoute, created }
    });

    axios.post.mockImplementationOnce(() => Promise.reject(response));

    await wrapper.vm.submit();

    let showAlert = wrapper.vm.showAlert;
    let alertComponent = wrapper.find(".v-alert");

    expect(showAlert).toBeTruthy();
    expect(alertComponent.exists()).toBeTruthy();
  });

  test("Alert hidden when submit is called", () => {
    let formatData = jest.fn();
    formatData.mockReturnValue(false);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { formatData, created }
    });

    wrapper.setData({ showAlert: true });

    let result = wrapper.vm.submit();
    let alertData = wrapper.vm.showAlert;

    expect(result).toBeFalsy();
    expect(alertData).toBeFalsy();
  });

  test("Upload button is not loading by default", () => {
    let loading = wrapper.vm.loading;
    let uploadButton = getUploadButton(wrapper);

    expect(loading).toBeFalsy();
    expect(uploadButton.exists()).toBeTruthy();
    expect(uploadButton.classes()).not.toContain("v-btn--loading");
  });

  test("Upload button is loading when clicked", () => {
    let formIsValid = jest.fn();
    formIsValid.mockReturnValue(true);

    let submit = jest.fn();
    submit.mockReturnValue(true);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { formIsValid, submit, created }
    });

    let uploadButton = getUploadButton(wrapper);
    uploadButton.trigger("click");

    let loading = wrapper.vm.loading;

    expect(loading).toBeTruthy();

    uploadButton = getUploadButton(wrapper);
    expect(uploadButton.classes()).toContain("v-btn--loading");
  });

  test("Upload button stops loading if form not valid", () => {
    let formIsValid = jest.fn();
    formIsValid.mockReturnValue(false);

    let submit = jest.fn();
    submit.mockReturnValue(true);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { formIsValid, submit, created }
    });

    wrapper.vm.validateAndSend();

    let loading = wrapper.vm.loading;
    let uploadButton = getUploadButton(wrapper);

    expect(loading).toBeFalsy();
    expect(uploadButton.classes()).not.toContain("v-btn--loading");
  });

  test("Upload buttons stops loading if submit fails", () => {
    let formIsValid = jest.fn();
    formIsValid.mockReturnValue(true);

    let submit = jest.fn();
    submit.mockReturnValue(false);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { formIsValid, submit, created }
    });

    wrapper.vm.validateAndSend();

    let loading = wrapper.vm.loading;
    let uploadButton = getUploadButton(wrapper);

    expect(loading).toBeFalsy();
    expect(uploadButton.classes()).not.toContain("v-btn--loading");
  });

  test("Upload button stops loading when data is processed", async () => {
    let response = {
      success: true,
      count: 5
    };

    let formIsValid = jest.fn();
    formIsValid.mockReturnValue(true);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { formIsValid, created }
    });

    axios.post.mockImplementationOnce(() => Promise.resolve(response));
    await wrapper.vm.validateAndSend();

    let loading = wrapper.vm.loading;
    let uploadButton = getUploadButton(wrapper);

    expect(loading).toBeFalsy();
    expect(uploadButton.classes()).not.toContain("v-btn--loading");
  });

  test("Upload buttons stops loading when data fails to process", async () => {
    let response = {
      success: true,
      count: 5
    };

    let formIsValid = jest.fn();
    formIsValid.mockReturnValue(true);

    wrapper = mount(BulkUpload, {
      localVue,
      vuetify,
      methods: { formIsValid, created }
    });

    axios.post.mockImplementationOnce(() => Promise.reject(response));
    await wrapper.vm.validateAndSend();

    let loading = wrapper.vm.loading;
    let uploadButton = getUploadButton(wrapper);

    expect(loading).toBeFalsy();
    expect(uploadButton.classes()).not.toContain("v-btn--loading");
  });
});
