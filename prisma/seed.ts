import { PrismaClient, Channel, Sentiment, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const THEMES = [
  { name: "Onboarding friction", color: "#f97316" },
  { name: "Billing & invoices", color: "#ef4444" },
  { name: "Dashboard performance", color: "#22c55e" },
  { name: "SSO / Security", color: "#a855f7" },
  { name: "Mobile experience", color: "#3b82f6" },
  { name: "Export & reporting", color: "#eab308" },
];

// One (content, channel, sentiment, customerLabel, themeIndex) tuple per row.
// ~20 items per theme (120+ total), matching Appendix A's "120+ varied items" requirement.
const FEEDBACK: [string, Channel, Sentiment, string, number][] = [
  // Theme 0 — Onboarding friction
  ["Onboarding took forever — I couldn't figure out how to invite my team.", "SUPPORT_TICKET", "NEGATIVE", "Acme Retail", 0],
  ["Setup wizard skipped a step and I had no idea my team wasn't invited.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 0],
  ["Onboarding emails go to spam for half our new hires.", "SUPPORT_TICKET", "NEGATIVE", "Acme Retail", 0],
  ["New team members still get confused during the invite step.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 0],
  ["Took three tries to figure out how to add a second workspace admin.", "SUPPORT_TICKET", "NEGATIVE", "Northwind Retail", 0],
  ["The welcome checklist doesn't explain what 'connect a channel' actually means.", "COMMUNITY", "NEGATIVE", "community_user_4", 0],
  ["Invite links expire way too fast, had to resend three times.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 0],
  ["Got stuck on step 2 of setup with no way to skip or go back.", "APP_STORE", "NEGATIVE", "App Store review", 0],
  ["Onboarding call was helpful but the follow-up docs contradict what the rep said.", "SALES_CALL", "NEUTRAL", "Finlogic Inc", 0],
  ["First week using it and onboarding felt smooth end to end.", "COMMUNITY", "POSITIVE", "community_user_19", 0],
  ["The onboarding checklist is clean now, much better than last quarter.", "APP_STORE", "POSITIVE", "App Store review", 0],
  ["Great onboarding call, the rep walked us through everything clearly.", "SALES_CALL", "POSITIVE", "Vertex Health", 0],
  ["Onboarding docs are clear now, no complaints this round.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 0],
  ["Would help to have a sample workspace pre-loaded during onboarding.", "COMMUNITY", "NEUTRAL", "community_user_11", 0],
  ["Sales rep promised a guided setup call but nobody followed up.", "SALES_CALL", "NEGATIVE", "Northwind Deal", 0],
  ["Onboarding progress bar shows 100% but two steps are clearly unfinished.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 0],
  ["Loved that onboarding let us import our old CSV on day one.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 0],
  ["Confusing that 'workspace' and 'team' mean different things in onboarding vs settings.", "COMMUNITY", "NEUTRAL", "community_user_8", 0],
  ["My team gave up on inviting members and just shares one login now.", "SUPPORT_TICKET", "NEGATIVE", "Acme Retail", 0],
  ["Onboarding tooltip overlaps the button it's pointing at on smaller laptops.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 0],

  // Theme 1 — Billing & invoices
  ["Billing page keeps timing out when I try to download an invoice.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 1],
  ["Invoice PDF download button just spins forever on Safari.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 1],
  ["Billing dashboard shows the wrong currency for our EU subsidiary.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 1],
  ["Invoice numbers don't match what's shown in the emailed PDF.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 1],
  ["Billing support was slow to respond this time, took three days.", "SUPPORT_TICKET", "NEGATIVE", "Acme Retail", 1],
  ["Got double-charged this month, support fixed it but it took a week.", "SUPPORT_TICKET", "NEGATIVE", "Northwind Retail", 1],
  ["Can't find where to update our purchase order number on invoices.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 1],
  ["Annual invoice doesn't break down per-seat costs, finance keeps asking.", "SALES_CALL", "NEGATIVE", "Northwind Deal", 1],
  ["Billing email went to our old finance contact who left months ago.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 1],
  ["Support resolved my billing issue within an hour. Great experience.", "SUPPORT_TICKET", "POSITIVE", "Beacon Labs", 1],
  ["Switching to annual billing was surprisingly painless, nice work.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 1],
  ["Invoice history export is handy for our quarterly audit.", "COMMUNITY", "POSITIVE", "community_user_15", 1],
  ["Would like a way to split one invoice across two cost centers.", "COMMUNITY", "NEUTRAL", "community_user_2", 1],
  ["Tax ID field on invoices doesn't validate EU VAT formats properly.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 1],
  ["Billing portal login is separate from the main app, easy to forget.", "SUPPORT_TICKET", "NEUTRAL", "Finlogic Inc", 1],
  ["Refund for a duplicate charge took two billing cycles to show up.", "SUPPORT_TICKET", "NEGATIVE", "Acme Retail", 1],
  ["Proration on our mid-cycle upgrade was calculated correctly, appreciated that.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 1],
  ["Invoice PDFs don't include our company logo like the old plan did.", "COMMUNITY", "NEUTRAL", "community_user_9", 1],
  ["Finance team wants a webhook for new invoices instead of checking manually.", "SALES_CALL", "NEUTRAL", "Vertex Health", 1],
  ["Card on file failed silently, no warning until service was paused.", "SUPPORT_TICKET", "NEGATIVE", "Northwind Retail", 1],

  // Theme 2 — Dashboard performance
  ["Charts on the dashboard take 10+ seconds to load with our data volume.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 2],
  ["Dashboard filters reset every time I refresh the page, annoying.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 2],
  ["The new dashboard is gorgeous and finally fast. Huge improvement.", "APP_STORE", "POSITIVE", "App Store review", 2],
  ["Really impressed with how fast support responded to my ticket.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 2],
  ["Team loves the new theme clustering — saved us hours of manual tagging.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 2],
  ["Ask LOOP answered my question about churn drivers perfectly.", "COMMUNITY", "POSITIVE", "community_user_3", 2],
  ["Dashboard finally feels snappy after the last update, nice work.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 2],
  ["Really like the spike alerts on the trends page, caught an issue early.", "COMMUNITY", "POSITIVE", "community_user_12", 2],
  ["Dashboard freezes for a few seconds whenever I switch date ranges.", "SUPPORT_TICKET", "NEGATIVE", "Northwind Retail", 2],
  ["Browser tab crashes if I leave the dashboard open overnight.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 2],
  ["Volume chart tooltip shows stale numbers until you hover twice.", "COMMUNITY", "NEGATIVE", "community_user_6", 2],
  ["Would love a dark mode for the dashboard, staring at white all day.", "COMMUNITY", "NEUTRAL", "community_user_14", 2],
  ["Loading skeleton is a nice touch, feels faster even when it isn't.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 2],
  ["Dashboard export to image cuts off the legend on wide charts.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 2],
  ["Sentiment breakdown chart is hard to read with three similar colors.", "COMMUNITY", "NEUTRAL", "community_user_1", 2],
  ["Top themes list only shows 5, we'd like to see all of them at a glance.", "COMMUNITY", "NEUTRAL", "community_user_17", 2],
  ["Dashboard on our office monitor renders tiny, no way to zoom the charts.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 2],
  ["Refresh button doesn't show any feedback while it's fetching new data.", "SUPPORT_TICKET", "NEGATIVE", "Acme Retail", 2],
  ["Stat cards are a great addition, exactly the summary we needed.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 2],
  ["Custom date range picker is fiddly on trackpads, hard to select exact days.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 2],

  // Theme 3 — SSO / Security
  ["Prospect wants SSO before they'll sign — third time this month.", "SALES_CALL", "NEGATIVE", "Northwind Deal", 3],
  ["Can we get an SSO / SAML option? Security team is blocking rollout.", "SALES_CALL", "NEGATIVE", "Vertex Health", 3],
  ["Still waiting on SSO. This is now a blocker for renewal.", "SALES_CALL", "NEGATIVE", "Northwind Deal", 3],
  ["Security review flagged the lack of SAML — deal is on hold.", "SALES_CALL", "NEGATIVE", "Vertex Health", 3],
  ["We need role-based export permissions before we can roll this out wider.", "SALES_CALL", "NEUTRAL", "Northwind Deal", 3],
  ["Would pay more for SSO if it shipped next quarter.", "SALES_CALL", "NEUTRAL", "Northwind Deal", 3],
  ["No audit log for who changed a member's role, security team wants that logged.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 3],
  ["Can't enforce a minimum password policy across the workspace.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 3],
  ["Two-factor auth setup was surprisingly quick once we found the setting.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 3],
  ["Session doesn't expire after inactivity, our compliance team flagged this.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 3],
  ["IP allowlisting isn't available on our current plan, we need it for compliance.", "SALES_CALL", "NEGATIVE", "Northwind Deal", 3],
  ["Appreciate that admin actions require re-authentication, good security default.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 3],
  ["SCIM provisioning would save our IT team a lot of manual work.", "SALES_CALL", "NEUTRAL", "Vertex Health", 3],
  ["Security questionnaire response took two weeks, slowed our procurement.", "SALES_CALL", "NEGATIVE", "Northwind Deal", 3],
  ["Role permissions are clear and well documented, easy to explain to auditors.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 3],
  ["No way to see active sessions or force-logout a lost device.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 3],
  ["Data residency in the EU is a hard requirement for our next contract.", "SALES_CALL", "NEUTRAL", "Vertex Health", 3],
  ["Penetration test report request went unanswered for over a week.", "SALES_CALL", "NEGATIVE", "Northwind Deal", 3],
  ["Liked that the security page clearly lists SOC 2 status upfront.", "COMMUNITY", "POSITIVE", "community_user_5", 3],
  ["Admin role can't be scoped to just one workspace in a multi-workspace org.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 3],

  // Theme 4 — Mobile experience
  ["It does the job, but the mobile experience needs work.", "NPS_SURVEY", "NEUTRAL", "Q3 NPS respondent", 4],
  ["Mobile app crashes when I rotate the screen on the reports tab.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Mobile nav is hard to tap on smaller screens, buttons feel cramped.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Please add dark mode to the mobile app, eyes hurt at night.", "APP_STORE", "NEUTRAL", "App Store review", 4],
  ["Mobile app logged me out mid-session twice today.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Mobile experience on tablets is basically unusable right now.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Battery drain is noticeable when the app runs in the background.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Dark mode looks great, exactly what I asked for last review.", "APP_STORE", "POSITIVE", "App Store review", 4],
  ["Push notifications on mobile arrive several hours late, sometimes not at all.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Mobile keyboard covers the submit button on the add-feedback form.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Swipe gestures in the inbox feel intuitive once you find them.", "APP_STORE", "POSITIVE", "App Store review", 4],
  ["Can't upload a photo attachment from the mobile app, only from desktop.", "SUPPORT_TICKET", "NEGATIVE", "Northwind Retail", 4],
  ["Mobile charts are too small to read without pinch-zooming constantly.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Offline mode would help a lot when I'm reviewing feedback on my commute.", "COMMUNITY", "NEUTRAL", "community_user_10", 4],
  ["App icon badge count never clears even after reading all notifications.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Mobile search doesn't support the same filters as desktop, confusing.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Loading a large report on mobile data takes forever, needs a lite mode.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Face ID login on mobile is a nice convenience, glad it's there.", "APP_STORE", "POSITIVE", "App Store review", 4],
  ["Tablet layout wastes a lot of horizontal space, feels like a stretched phone view.", "APP_STORE", "NEGATIVE", "App Store review", 4],
  ["Mobile app update notes never explain what actually changed.", "APP_STORE", "NEUTRAL", "App Store review", 4],

  // Theme 5 — Export & reporting
  ["Love the new export feature, saved me an hour today.", "COMMUNITY", "POSITIVE", "community_user_12", 5],
  ["Exported CSV is missing the theme column, had to re-download twice.", "SUPPORT_TICKET", "NEGATIVE", "Northwind Retail", 5],
  ["Would like scheduled report emails instead of manual export every week.", "COMMUNITY", "NEUTRAL", "community_user_7", 5],
  ["Loved how the VoC report summarized our whole quarter in one page.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 5],
  ["Can the CSV export include sentiment score as a column?", "COMMUNITY", "NEUTRAL", "community_user_7", 5],
  ["Export to PDF cuts off the last column on wide tables.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 5],
  ["Report generation is fast now, used to time out on large date ranges.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 5],
  ["Can't export just the filtered subset, it always exports everything.", "SUPPORT_TICKET", "NEGATIVE", "Beacon Labs", 5],
  ["Weekly digest email would save me from logging in just to check numbers.", "COMMUNITY", "NEUTRAL", "community_user_16", 5],
  ["Export filename doesn't include the date range, hard to keep track of versions.", "SUPPORT_TICKET", "NEGATIVE", "Acme Retail", 5],
  ["PDF report branding matches our style guide nicely, easy to forward to leadership.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 5],
  ["CSV export uses commas inside quoted fields incorrectly, breaks in Excel.", "SUPPORT_TICKET", "NEGATIVE", "Northwind Retail", 5],
  ["Would like to export straight to Google Sheets instead of downloading a file.", "COMMUNITY", "NEUTRAL", "community_user_13", 5],
  ["Recommendations section in the report was genuinely actionable this time.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 5],
  ["Export button is easy to miss, buried at the bottom of the page.", "SUPPORT_TICKET", "NEGATIVE", "Vertex Health", 5],
  ["Quarterly report took under a minute to generate, much faster than before.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 5],
  ["No way to compare this month's report against last month's side by side.", "COMMUNITY", "NEUTRAL", "community_user_18", 5],
  ["Report quotes were pulled verbatim, made it easy to trust the summary.", "NPS_SURVEY", "POSITIVE", "Q3 NPS respondent", 5],
  ["Export API would help us pipe data into our own BI tool automatically.", "SALES_CALL", "NEUTRAL", "Northwind Deal", 5],
  ["PDF export sometimes shows placeholder text instead of the real chart image.", "SUPPORT_TICKET", "NEGATIVE", "Finlogic Inc", 5],
];

async function main() {
  console.log("Seeding LOOP demo data...");

  const workspace = await db.workspace.create({
    data: { name: "Acme Corp" },
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  await db.user.createMany({
    data: [
      { name: "Alex Johnson", email: "admin@acme.com", passwordHash, role: "ADMIN", workspaceId: workspace.id },
      { name: "Priya Nair", email: "analyst@acme.com", passwordHash, role: "ANALYST", workspaceId: workspace.id },
      { name: "Sam Rivera", email: "viewer@acme.com", passwordHash, role: "VIEWER", workspaceId: workspace.id },
    ],
  });

  const themeRecords = await Promise.all(
    THEMES.map((t) =>
      db.theme.create({
        data: { name: t.name, color: t.color, workspaceId: workspace.id },
      })
    )
  );

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  for (let i = 0; i < FEEDBACK.length; i++) {
    const [content, channel, sentiment, customerLabel, themeIdx] = FEEDBACK[i];
    const sentimentScore =
      sentiment === "POSITIVE" ? 0.6 + Math.random() * 0.4 :
      sentiment === "NEGATIVE" ? -0.6 - Math.random() * 0.4 :
      -0.2 + Math.random() * 0.4;

    const feedback = await db.feedback.create({
      data: {
        content,
        channel,
        customerLabel,
        sentiment,
        sentimentScore,
        status: (["NEW", "REVIEWED", "ACTIONED"] as FeedbackStatus[])[i % 3],
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
        workspaceId: workspace.id,
      },
    });

    await db.feedbackTheme.create({
      data: {
        feedbackId: feedback.id,
        themeId: themeRecords[themeIdx].id,
        confidence: 0.8 + Math.random() * 0.2,
      },
    });
  }

  console.log(`Done. Workspace: ${workspace.name} (${workspace.id})`);
  console.log("Login with: admin@acme.com / analyst@acme.com / viewer@acme.com, password: Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });