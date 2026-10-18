import React, { useState } from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import AdminTeamMember from "../../src/app/(pages)/(main)/(protected)/admin/team/page";

const image =
  "https://firebasestorage.googleapis.com/v0/b/demo.appspot.com/o/team%2Foriginal.png?alt=media&token=test";
const member = {
  name: "Alex",
  email: "alex@example.com",
  title: "Director",
  image,
};

function Editor({ initialId = "" }: { initialId?: string }) {
  const [id, setId] = useState(initialId);
  const router = {
    push: cy.stub().as("navigate"),
    replace: cy.stub(),
    refresh: cy.stub(),
    back: cy.stub(),
    forward: cy.stub(),
    prefetch: cy.stub(),
  };
  return (
    <AppRouterContext.Provider value={router}>
      <SearchParamsContext.Provider
        value={new URLSearchParams(id ? `update=${id}` : "")}
      >
        <button onClick={() => setId("second")}>Edit second member</button>
        <button onClick={() => setId("")}>Add another member</button>
        <AdminTeamMember />
      </SearchParamsContext.Provider>
    </AppRouterContext.Provider>
  );
}

function fillMember(email: string) {
  cy.get("#name").clear().type("Alex");
  cy.get("#email").clear().type(email);
  cy.get("#title").clear().type("Director");
}

function selectImage() {
  cy.get('input[type="file"]').selectFile(
    {
      contents: Cypress.Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
        "base64",
      ),
      fileName: "member.png",
      mimeType: "image/png",
    },
    { force: true },
  );
  cy.get('img[alt="Preview"]')
    .should("have.attr", "src")
    .and("match", /^data:/);
}

describe("team member editor regressions", () => {
  let uploads = 0;
  beforeEach(() => {
    uploads = 0;
    // Exercise the real upload helper while keeping Firebase isolated from live data.
    cy.intercept("https://firebasestorage.googleapis.com/**", (req) => {
      if (req.method === "POST") uploads++;
      const url = new URL(req.url);
      const name =
        url.searchParams.get("name") ||
        decodeURIComponent(url.pathname.split("/o/")[1] || "");
      req.reply({
        statusCode: 200,
        body: { name, bucket: "demo.appspot.com", downloadTokens: "test" },
      });
    }).as("storage");
  });

  it("adds multiple members with the same name and distinct photo paths", () => {
    const photos: string[] = [];
    cy.intercept("POST", "/api/team/create", (req) => {
      photos.push(req.body.image);
      req.reply({ statusCode: 200, body: "Success" });
    }).as("create");
    cy.mount(<Editor />);
    for (const email of ["alex@example.com", "alex2@example.com"]) {
      fillMember(email);
      selectImage();
      cy.get('button[type="submit"]').click();
      cy.wait("@create").its("request.body.email").should("equal", email);
      cy.get('[role="status"]').should("contain", "Team member added");
      cy.get("#name").should("have.value", "");
      cy.get('img[alt="Preview"]').should("not.exist");
    }
    cy.then(() => {
      expect(photos).to.have.length(2);
      expect(photos[0]).not.to.equal(photos[1]);
    });
  });

  it("preserves input and reuses the photo upload when a save is retried", () => {
    let attempts = 0;
    let firstImage = "";
    cy.intercept("POST", "/api/team/create", (req) => {
      attempts++;
      if (attempts === 1) {
        firstImage = req.body.image;
        req.reply({
          statusCode: 409,
          body: { message: "A team member with this email already exists." },
        });
      } else {
        expect(req.body.image).to.equal(firstImage);
        req.reply({ statusCode: 200, body: "Success" });
      }
    }).as("create");
    cy.mount(<Editor />);
    fillMember("alex@example.com");
    selectImage();
    cy.get('button[type="submit"]').click();
    cy.wait("@create");
    cy.get('[role="alert"]').should("contain", "email already exists");
    cy.get("#name").should("have.value", "Alex");
    cy.get("#email").clear().type("new@example.com");
    cy.get('button[type="submit"]').click();
    cy.wait("@create");
    cy.get('[role="status"]').should("contain", "Team member added");
    cy.then(() => expect(uploads).to.equal(1));
  });

  it("keeps an existing photo on repeated edits without uploading it again", () => {
    let saved = { ...member };
    cy.intercept("GET", "/api/team/query/first", (req) =>
      req.reply({ body: saved }),
    );
    cy.intercept("PUT", "/api/team/update/first", (req) => {
      saved = req.body;
      req.reply({ body: "Success" });
    }).as("update");
    cy.mount(<Editor initialId="first" />);
    cy.get("#name").should("have.value", "Alex");
    for (const title of ["Manager", "Advisor"]) {
      cy.get("#title").clear().type(title);
      cy.get('button[type="submit"]').click();
      cy.wait("@update")
        .its("request.body")
        .should("include", { title, image });
      cy.get("@navigate").should("have.been.calledWith", "/team");
    }
    cy.then(() => expect(uploads).to.equal(0));
  });

  it("clears edit state when switching to add mode and ignores an old delayed load", () => {
    cy.intercept("GET", "/api/team/query/first", { delay: 800, body: member });
    cy.intercept("GET", "/api/team/query/second", {
      body: { ...member, name: "Sam" },
    }).as("second");
    cy.mount(<Editor initialId="first" />);
    cy.get('button[type="submit"]').should("be.disabled");
    cy.contains("button", "Edit second member").click();
    cy.wait("@second");
    cy.get("#name").should("have.value", "Sam");
    cy.contains("button", "Add another member").click();
    cy.get("#name").should("have.value", "");
    cy.get('img[alt="Preview"]').should("not.exist");
    cy.get('button[type="submit"]').should("be.enabled");
  });

  it("reports failed member loads and prevents saving an empty edit", () => {
    cy.intercept("GET", "/api/team/query/missing", {
      statusCode: 404,
      body: { message: "Team member not found" },
    });
    cy.mount(<Editor initialId="missing" />);
    cy.get('[role="alert"]').should("contain", "Unable to load this member");
    cy.get('button[type="submit"]').should("be.disabled");
  });
});
