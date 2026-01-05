const express = require("express");
const xml2js = require("xml2js");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

function clean(value) {
  if (!value) return "";
  return String(value).replace(/NOTPROVIDED/gi, "").trim();
}

function formatDateYYMMDD(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const yy = String(date.getUTCFullYear()).slice(2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function buildMT103(data) {
  const grpHdr = data.GrpHdr || {};
  const txInfo = data.CdtTrfTxInf || {};
  const dbtr = txInfo.Dbtr || {};
  const cdtr = txInfo.Cdtr || {};
  const sttlmInf = grpHdr.SttlmInf || {};

  let mt103 = ["{4:"];
  const instrId = clean(txInfo.PmtId?.InstrId || "");
  mt103.push(`:20:${instrId}`);
  mt103.push(`:23B:CRED`);

  const valueDate = formatDateYYMMDD(txInfo.IntrBkSttlmDt) || formatDateYYMMDD(grpHdr.CreDtTm);
  const currency = txInfo.IntrBkSttlmAmt?.["$"]?.Ccy || "";
  let amount = txInfo.IntrBkSttlmAmt?._ || txInfo.IntrBkSttlmAmt || "";
  if (amount) {
    amount = String(amount).replace(".", ",");
    if (!amount.includes(",")) {
      amount = amount + ",00";
    }
  }
  mt103.push(`:32A:${valueDate}${currency}${amount}`);

  const dbtrIban = clean(txInfo.DbtrAcct?.Id?.IBAN || "");
  mt103.push(`:50K:/${dbtrIban}`);
  const dbtrName = clean(dbtr.Nm || "");
  if (dbtrName) {
    mt103.push(dbtrName);
  }
  const dbtrAddr = dbtr.PstlAdr?.AdrLine || [];
  const dbtrAddressArray = Array.isArray(dbtrAddr) ? dbtrAddr : [dbtrAddr].filter(Boolean);
  dbtrAddressArray.forEach(line => {
    const cleanLine = clean(line);
    if (cleanLine) {
      mt103.push(cleanLine);
    }
  });

  const dbtrAgent = clean(txInfo.DbtrAgt?.FinInstnId?.BICFI || "");
  mt103.push(`:52A:${dbtrAgent}`);

  const instgAgent = clean(sttlmInf.InstgRmbrsmntAgt?.FinInstnId?.BICFI || "");
  mt103.push(`:53A:${instgAgent}`);

  const instdAgent = clean(sttlmInf.InstdRmbrsmntAgt?.FinInstnId?.BICFI || "");
  mt103.push(`:54A:${instdAgent}`);

  const cdtrAgent = clean(txInfo.CdtrAgt?.FinInstnId?.BICFI || "");
  mt103.push(`:57A:${cdtrAgent}`);

  const cdtrAccount = clean(txInfo.CdtrAcct?.Id?.Othr?.Id || txInfo.CdtrAcct?.Id?.IBAN || "");
  mt103.push(`:59:/${cdtrAccount}`);
  const cdtrName = clean(cdtr.Nm || "");
  if (cdtrName) {
    mt103.push(cdtrName);
  }
  const cdtrAddr = cdtr.PstlAdr?.AdrLine || [];
  const cdtrAddressArray = Array.isArray(cdtrAddr) ? cdtrAddr : [cdtrAddr].filter(Boolean);
  cdtrAddressArray.forEach(line => {
    const cleanLine = clean(line);
    if (cleanLine) {
      mt103.push(cleanLine);
    }
  });

  const remittanceInfo = clean(txInfo.RmtInf?.Ustrd || "");
  mt103.push(`:70:${remittanceInfo}`);

  let charges = "";
  if (txInfo.ChrgBr) {
    const chrgBr = clean(txInfo.ChrgBr);
    switch (chrgBr) {
      case "DEBT":
        charges = "OUR";
        break;
      case "CRED":
        charges = "BEN";
        break;
      case "SHAR":
        charges = "SHA";
        break;
      default:
        charges = chrgBr;
    }
  }
  mt103.push(`:71A:${charges}`);
  mt103.push("-}");

  return mt103.join("\n");
}

app.post("/convert-text", (req, res) => {
  const xmlText = req.body.xml;
  if (!xmlText || !xmlText.trim()) {
    return res.status(400).send("No XML provided");
  }
  console.log("Received XML length:", xmlText.length);

  xml2js.parseString(xmlText, { explicitArray: false }, (err, result) => {
    if (err) {
      console.error("XML Parse Error:", err.message);
      return res.status(500).send(`Error parsing XML: ${err.message}`);
    }

    try {
      const data = result.Document?.FIToFICstmrCdtTrf || result.FIToFICstmrCdtTrf;
      if (!data) {
        console.log("Available keys:", Object.keys(result));
        return res.status(500).send("FIToFICstmrCdtTrf element not found in XML");
      }

      const mt103 = buildMT103(data);
      res.type("text/plain").send(mt103);
    } catch (error) {
      console.error("Conversion Error:", error.message);
      return res.status(500).send(`Error converting to MT103: ${error.message}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ ISO20022 to MT103 Converter`);
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Opening browser automatically...`);
  console.log(`✅ To stop the server, press Ctrl+C`);

  const url = `http://localhost:${PORT}`;
  let cmd;
  switch (process.platform) {
    case 'win32':
      cmd = 'start';
      break;
    case 'darwin':
      cmd = 'open';
      break;
    default:
      cmd = 'xdg-open';
  }

  setTimeout(() => {
    spawn(cmd, [url], { shell: true, detached: true, stdio: 'ignore' });
  }, 1000);
});
