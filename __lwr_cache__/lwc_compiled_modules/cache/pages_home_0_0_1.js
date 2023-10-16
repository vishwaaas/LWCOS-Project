import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement } from "lwc";
import _tmpl from "./home.html";
const SERVER_URL = 'http://localhost:3004';
class Home extends LightningElement {
  constructor(...args) {
    super(...args);
    this.expenseRecords = [];
  }
  async connectedCallback() {
    const expenses = await this.getExpenses();
    console.log("expenses", expenses);
    this.expenseRecords = expenses.totalSize > 0 ? expenses.records : [];
  }

  //Method to get Expenses data
  async getExpenses() {
    const url = `${SERVER_URL}/expenses`;
    return await this.makeApiRequest(url);
  }

  //Generic API Method
  async makeApiRequest(url, method = 'GET', data = null) {
    try {
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : null
      };
      const response = await fetch(url, requestOptions);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    } catch (error) {
      console.log("Error Occurred", error);
    }
  }

  //edit row handler
  editHandler(event) {
    console.log(event.detail);
  }
  //delete row handler
  deleteHandler(event) {
    console.log(event.detail);
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(Home, {
  fields: ["expenseRecords"]
});
export default _registerComponent(Home, {
  tmpl: _tmpl,
  sel: "pages-home",
  apiVersion: 59
});