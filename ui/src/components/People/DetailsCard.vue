<template>
  <v-card class="mb-5">
    <v-card-title
      :class="applyDetailCardTitleStyle"
      class="SectionTitle"
      @click="toggleSectionDetailDisplay"
    >
      {{ this.name | sentenceCase }}
      <v-spacer />
      <v-btn
        fab
        :class="applyDetailCardBtnSize"
        class="primary"
        @click.stop="
          editing = true;
          editButton = false;
        "
        v-show="editButton && edit"
        v-if="!Array.isArray(data)"
        v-on:click="toggleForm(name)"
      >
        <v-icon>edit</v-icon>
      </v-btn>
      <v-btn
        :class="applyDetailCardBtnSize"
        fab
        class="error"
        v-show="editButton && edit"
        v-if="!Array.isArray(data)"
        v-on:click="deleteItem()"
      >
        <v-icon>delete</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-alert v-model="alert.show" dismissable :type="alert.type">
        {{ alert.message }}
      </v-alert>
    </v-card-text>

    <transition name="fade">
      <v-card-text
        v-if="Array.isArray(sanitized)"
        v-show="!editing && showSectionDetail"
      >
        <div v-for="(value, name) in sanitized" v-bind:key="name">
          <div v-if="Number.isInteger(name)">
            <v-layout row align-baseline>
              <v-flex xs4 class="primary--text text-uppercase pl-5">
                {{ value[subheader] }}
              </v-flex>

              <v-spacer />

              <v-btn
                :class="applyDetailCardBtnSize"
                fab
                class="primary"
                v-show="editButton && edit"
                v-if="Array.isArray(sanitized)"
                v-on:click="toggleForm(name)"
              >
                <v-icon>edit</v-icon>
              </v-btn>

              <v-btn
                :class="applyDetailCardBtnSize"
                fab
                class="error"
                v-show="editButton && edit"
                v-if="Array.isArray(sanitized)"
                v-on:click="deleteItem(name)"
              >
                <v-icon>delete</v-icon>
              </v-btn>
            </v-layout>

            <v-simple-table>
              <tbody>
                <tr
                  v-for="(sanitized, fieldIndex) in value"
                  v-bind:key="fieldIndex"
                >
                  <td :width="headerWidth" class="font-weight-bold">
                    {{ fieldIndex | sentenceCase }}
                  </td>
                  <td>{{ sanitized | separateByCommas }}</td>
                </tr>
              </tbody>
            </v-simple-table>

            <v-divider class="pb-3" />
          </div>
          <div v-else>
            <v-layout row>
              <v-flex xs4 class="font-weight-bold">
                {{ name | sentenceCase }}
              </v-flex>
              <v-flex
                xs8
                v-for="(sanitized, index) in value"
                v-bind:key="index"
              >
                {{ sanitized | separateByCommas }}
              </v-flex>
            </v-layout>

            <v-divider class="pb-3" />
          </div>
        </div>
      </v-card-text>

      <v-card-text v-show="!editing" v-else-if="typeof sanitized !== 'object'">
        <v-simple-table>
          <tbody>
            <tr>
              <td :width="headerWidth" class="font-weight-bold">
                {{ this.name | sentenceCase }}
              </td>
              <td>{{ sanitized }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card-text>

      <v-card-text v-show="!editing" v-else>
        <v-simple-table>
          <tbody>
            <tr v-for="(value, name) in sanitized" v-bind:key="name">
              <td :width="headerWidth" class="font-weight-bold">
                {{ name | sentenceCase }}
              </td>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-divider class="pb-3" />
      </v-card-text>
    </transition>
    <v-card-text
      v-show="allowMultiple && showMultiple && edit && showSectionDetail"
    >
      <v-btn
        class="font-weight-bold primary--text text-uppercase"
        text
        depressed
        @click.stop="showAddForm"
      >
        Add Another
      </v-btn>
    </v-card-text>

    <v-card-text v-show="editing">
      <DynamicForm
        :fields="this.fields"
        :name="this.name"
        v-on:cancel="cancel"
        v-on:successfulSubmit="submit"
        v-on:failedSubmit="showFailedSubmit"
        ref="dynamicEditingForm"
        :key="dynamicFormKey"
        :validationRules="validationRules"
      />
    </v-card-text>
  </v-card>
</template>

<script>
import axios from "axios";
import _ from "lodash";

import DynamicForm from "@/components/Form/DynamicForm.vue";
import Practitioner from "@/mixins/Practitioner.js";
import StructureDefinition from "@/mixins/StructureDefinition.js";
import MobileLayout from "@/mixins/MobileLayout.js";

export default {
  computed: {
    applyDetailCardTitleStyle() {
      return this.detailCardTitleStyle(this.screenSize);
    },
    applyDetailCardBtnSize() {
      var btnSize = this.detailCardBtnSize(this.screenSize);
      return btnSize;
    }
  },
  asyncComputed: {
    async sanitized() {
      let sanitized = [];
      let data = JSON.parse(JSON.stringify(this.data));

      if (!Array.isArray(data)) {
        return data;
      }

      // Qualifications requires it's own special thing
      if (this.name === "Qualifications") {
        for (var k in data) {
          let element = data[k];
          let issuer = "";
          let number = "";
          let received = "";
          let expiration = "";

          if (element.issuer) {
            let reference = element.issuer.reference.split("/");

            let response = await axios.get(
              this.config.backend +
                "/structure-definition/get/" +
                reference[0] +
                "/" +
                reference[1]
            );

            issuer = response.data.name;
          }

          if (element.identifier && element.identifier[0]) {
            number = element.identifier[0].value;
          } else if (element.identifier && element.identifier.value) {
            number = element.identifier.value;
          }

          if (element.period) {
            received = element.period.start;
            expiration = element.period.end;
          }

          sanitized.push({
            type: element.code.text,
            issuer: issuer,
            number: number,
            received: received,
            expiration: expiration
          });
        }

        return sanitized;
      }

      for (var i in data) {
        let element = data[i];

        for (var j in element) {
          // never render id or resourceType fields
          if (j === "id" || j === "resourceType") {
            delete element[j];
            continue;
          }

          // ignore practitioner and meta fields for work history card
          if (
            this.name === "workHistory" &&
            (j === "practitioner" || j === "meta")
          ) {
            delete element[j];
            continue;
          }

          let field = element[j];

          if (field[0]) {
            field = field[0];
          }

          if (field.extension) {
            if (field[0]) {
              field = field[0];
            }

            if (field.extension) {
              field = field.extension;
            }

            if (field[0]) {
              field = field[0];
            }

            if (field.valueReference) {
              let reference = field.valueReference.reference.split("/");

              let result = await axios.get(
                this.config.backend +
                  "/structure-definition/get/" +
                  reference[0] +
                  "/" +
                  reference[1]
              );

              let text = "";

              // look for a name, title, or text field
              if (result.data.name) {
                text = result.data.name;
              } else if (result.data.title) {
                text = result.data.title;
              } else {
                text = result.data.text;
              }

              delete element[j];

              if (text !== "" && text !== undefined) {
                element[field.url] = text;
              }
            }
          } else if (field.reference) {
            let reference = field.reference.split("/");

            let result = await axios.get(
              this.config.backend +
                "/structure-definition/get/" +
                reference[0] +
                "/" +
                reference[1]
            );
            let text = "";

            // look for a name, title, or text field
            if (result.data.name) {
              text = result.data.name;
            } else if (result.data.title) {
              text = result.data.title;
            } else {
              text = result.data.text;
            }

            element[j] = text;
          } else if (typeof field === "object" && field !== null) {
            if (field.start) {
              element[j] = field.start + " - ";

              if (field.end) {
                element[j] += field.end;
              } else {
                element[j] += "present";
              }
            } else if (field.text) {
              element[j] = field.text;
            } else if (field.code) {
              element[j] = field.code;
            } else if (field.value) {
              element[j] = field.value;
            }
          }
        }

        sanitized.push(element);
      }

      return sanitized;
    }
  },
  components: {
    DynamicForm
  },
  created() {
    this.config = require("@/config/config.json");

    switch (this.name) {
      case "address":
        this.subheader = "use";
        break;

      case "communication":
        this.subheader = "text";
        break;

      case "contained":
        this.subheader = "language";
        break;

      case "Personal identifier":
        this.subheader = "use";
        break;

      case "meta":
        this.subheader = "versionId";
        break;

      case "name":
        this.subheader = "use";
        break;

      case "photo":
        this.subheader = "title";
        break;

      case "Personal telephone number":
      case "telecom":
        this.subheader = "system";
        break;

      case "text":
        this.subheader = "status";
        break;
    }

    if (this.edit) {
      this.getSections().then(sections => {
        // find the matching section, that will be the fields
        for (var i in sections) {
          let section = sections[i];

          if (
            section.id === this.name ||
            section.id.endsWith("." + this.name) ||
            section.label === this.name
          ) {
            this.key = section.id.substring(section.id.lastIndexOf(".") + 1);

            if (section.max === "*") {
              this.allowMultiple = true;
            }

            let structureDefinition = section.type[0].code;

            if (
              structureDefinition === "Extension" &&
              section.type[0].profile &&
              section.type[0].profile[0]
            ) {
              let profile = section.type[0].profile[0];
              this.profile = profile;

              structureDefinition = profile.slice(profile.lastIndexOf("/") + 1);
            }

            this.showForm(this.name, structureDefinition, section).then(
              fields => {
                this.editButton = true;
                this.fields = fields;
              }
            );

            break;
          }
        }
      });
    }
  },
  data() {
    return {
      alert: {
        message: null,
        show: false,
        type: null
      },
      allowMultiple: false,
      config: null,
      currentIndex: null,
      dynamicFormKey: 0,
      editButton: false,
      editing: false,
      fields: [],
      headerWidth: "30%",
      key: null,
      profile: null,
      showMultiple: true,
      showSectionDetail: true,
      structureDefinition: null,
      subheader: null
    };
  },
  methods: {
    cancel() {
      this.editing = false;
      this.editButton = true;
      this.showMultiple = true;
      this.$refs.dynamicEditingForm.reset();

      let fields = this.fields;

      for (var i in fields) {
        fields[i].value = null;
      }
    },
    deleteItem(index) {
      let names = {
        key: this.key,
        name: this.name
      };

      this.$emit("deleteData", names, index, this.profile);
    },
    showAddForm() {
      this.$refs.dynamicEditingForm.reset();
      let fields = this.fields;

      for (var i in fields) {
        fields[i].value = null;
        this.structureDefinition = i.substring(0, i.indexOf("."));
      }

      this.$refs.dynamicEditingForm.changeFields(fields);

      this.currentIndex = -1;
      this.dynamicFormKey++;
      this.editing = true;
      this.editButton = false;
      this.showMultiple = false;
    },
    showAlert(message, type) {
      this.alert.message = message;
      this.alert.type = type;
      this.alert.show = true;
    },
    showFailedSubmit() {
      this.alert.message = "Invalid input, please correct all errors.";
      this.alert.type = "error";
      this.alert.show = true;
    },
    submit() {
      let inputs = this.$refs.dynamicEditingForm.getInputs();
      let name = this.$refs.dynamicEditingForm.getName();
      let names = {
        key: this.key,
        name: name
      };

      if (Object.keys(inputs).length === 1 && inputs[name]) {
        inputs = inputs[name];
      }

      this.$emit(
        "saveData",
        inputs,
        names,
        this.currentIndex,
        this.profile,
        this.structureDefinition
      );

      this.cancel();
    },
    toggleForm(index) {
      let fields = this.fields;
      let key = null;

      for (var i in fields) {
        this.structureDefinition = i.substring(0, i.indexOf("."));
      }

      // qualifications are weird
      if (this.name === "Qualifications") {
        let data = this.data[index];

        if (data.code) {
          fields["Qualification.type"].value = data.code.text;
        }

        if (data.issuer) {
          fields["Qualification.issuer"].value = {
            reference: data.issuer.reference
          };
        }

        if (data.identifier) {
          fields["Qualification.number"].value = data.identifier[0].value;
        }

        if (data.period) {
          fields["Qualification.received"].value = data.period.start;
          fields["Qualification.expiration"].value = data.period.end;
        }
      } else if (Object.keys(fields).length === 1) {
        for (key in fields) {
          if (fields[key].name === "value") {
            fields[key].labelOverride = this.name;
          }

          if (!Array.isArray(this.data)) {
            // collapse for objects
            if (
              typeof this.data === "object" &&
              this.data !== null &&
              Object.keys(this.data).length === 1
            ) {
              for (index in this.data) {
                fields[key].value = this.data[index];
              }
            } else {
              fields[key].value = this.data;
            }
          } else if (this.data[key]) {
            fields[key].value = this.data[key];
          } else {
            let cleanKey = key.substring(key.lastIndexOf(".") + 1);
            fields[key].value = this.data[cleanKey];
          }
        }
      } else {
        for (key in fields) {
          // if there is more than one period, then we need to flatten the data
          let field = fields[key];
          let value = null;

          if (key.indexOf(".") > 1) {
            value = _.get(this.data[index], field.title.slice("."));

            // if no value is set, it might be a multiarray so we need to tweak title a bit
            if (value === undefined) {
              let title = key.toLowerCase().split(".");

              if (title[0] === "practitionerrole") {
                title.shift();
              }

              title.splice(1, 0, 0);

              value = _.get(this.data[index], title);
            }

            fields[key].value = value;
          } else {
            value = this.data[index][field.title];

            //Datetime value comes as data[index]['period']['nameofthefield'],
            //data[index][field.title] returns undefined since field.title does not correspont the the array key
            if (
              fields[key].type == "dateTime" &&
              this.data[index][field.title.split(".")[0]] != null
            ) {
              fields[key].value = this.data[index][field.title.split(".")[0]][
                field.title.split(".")[2].toLowerCase()
              ];
            } else {
              fields[key].value = this.data[index][field.title];
            }
          }
        }
      }

      this.$refs.dynamicEditingForm.changeFields(fields);

      this.currentIndex = index;
      this.dynamicFormKey++;
      this.editing = true;
      this.editButton = false;
      this.showMultiple = false;
    },
    toggleSectionDetailDisplay() {
      this.showSectionDetail = !this.showSectionDetail;
    }
  },
  mixins: [Practitioner, StructureDefinition, MobileLayout],
  props: {
    data: {},
    edit: {
      default: false,
      type: Boolean
    },
    name: {
      default: null,
      type: String
    },
    validationRules: {},
    screenSize: {
      default: null,
      type: String
    }
  }
};
</script>
<style scoped>
.SectionTitle {
  cursor: pointer;
}
.error {
  margin-left: 5px;
}
.fade-enter {
  opacity: 0;
}
.fade-enter-active {
  transition: opacity 0.3s;
}
.fade-leave {
}
.fade-leave-active {
  transition: opacity 0.3s;
  opacity: 0;
}
</style>
