document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("routing-form");
  const requestTextInput = document.getElementById("request_text");
  const charCount = document.getElementById("char-count");
  const formError = document.getElementById("form-error");
  const submitButton = document.getElementById("submit-button");
  const buttonLabel = document.getElementById("button-label");
  const serviceStatus = document.getElementById("service-status");

  const emptyState = document.getElementById("empty-state");
  const loadingState = document.getElementById("loading-state");
  const resultState = document.getElementById("result-state");

  const predictedTeam = document.getElementById("predicted-team");
  const confidenceValue = document.getElementById("confidence-value");
  const confidenceBar = document.getElementById("confidence-bar");
  const alternativesList = document.getElementById("alternatives-list");
  const signalsList = document.getElementById("signals-list");
  const disclaimerEl = document.getElementById("disclaimer");

  // Check health on startup
  async function checkHealth() {
    try {
      const res = await fetch("/health");
      if (res.ok) {
        const data = await res.json();
        if (serviceStatus) {
          serviceStatus.textContent = "Online · Model loaded";
          serviceStatus.style.color = "#34d399";
        }
      } else {
        if (serviceStatus) {
          serviceStatus.textContent = "Degraded (Status " + res.status + ")";
        }
      }
    } catch {
      if (serviceStatus) {
        serviceStatus.textContent = "Offline · Reconnecting…";
        serviceStatus.style.color = "#f87171";
      }
    }
  }

  checkHealth();

  // Character counter for textarea
  if (requestTextInput && charCount) {
    const updateCount = () => {
      const len = requestTextInput.value.length;
      charCount.textContent = `${len} / 10000`;
      if (len > 9000) {
        charCount.style.color = "#e11d48";
      } else {
        charCount.style.color = "";
      }
    };
    requestTextInput.addEventListener("input", updateCount);
    updateCount();
  }

  // Keyboard shortcut: Ctrl/Cmd + Enter to submit
  if (form) {
    form.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }

  // Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (formError) {
        formError.hidden = true;
        formError.textContent = "";
      }

      const formData = new FormData(form);
      const payload = {
        request_id: formData.get("request_id")?.toString().trim() || null,
        created_at_ist: formData.get("created_at_ist")?.toString().trim() || null,
        channel: formData.get("channel")?.toString().trim() || "",
        source: formData.get("source")?.toString().trim() || "",
        product_family: formData.get("product_family")?.toString().trim() || "",
        warranty_status: formData.get("warranty_status")?.toString().trim() || "",
        request_text: formData.get("request_text")?.toString().trim() || "",
      };

      // Basic client-side validation
      if (!payload.request_text || payload.request_text.length < 3) {
        showError("Please enter a request description of at least 3 characters.");
        return;
      }
      if (!payload.channel || !payload.product_family || !payload.warranty_status || !payload.source) {
        showError("Please fill in all required fields (Channel, Source, Product family, Warranty status).");
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Prediction failed with status ${response.status}`);
        }

        const data = await response.json();
        renderResult(data);
      } catch (err) {
        showError(err.message || "An unexpected error occurred while predicting the team.");
        if (emptyState) emptyState.hidden = false;
        if (resultState) resultState.hidden = true;
      } finally {
        setLoading(false);
      }
    });
  }

  function setLoading(isLoading) {
    if (submitButton) {
      submitButton.disabled = isLoading;
    }
    if (buttonLabel) {
      buttonLabel.textContent = isLoading ? "Analyzing request…" : "Generate routing recommendation";
    }
    if (isLoading) {
      if (emptyState) emptyState.hidden = true;
      if (resultState) resultState.hidden = true;
      if (loadingState) loadingState.hidden = false;
    } else {
      if (loadingState) loadingState.hidden = true;
    }
  }

  function showError(msg) {
    if (formError) {
      formError.hidden = false;
      formError.textContent = msg;
      formError.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function renderResult(data) {
    if (!resultState) return;

    if (predictedTeam) {
      predictedTeam.textContent = data.team;
    }

    if (confidenceValue) {
      confidenceValue.textContent = `${data.confidence_percent}%`;
    }

    if (confidenceBar) {
      const pct = Math.min(100, Math.max(0, data.confidence_percent));
      confidenceBar.style.width = `${pct}%`;
      if (pct >= 75) {
        confidenceBar.style.background = "linear-gradient(90deg, #10b981, #059669)";
      } else if (pct >= 50) {
        confidenceBar.style.background = "linear-gradient(90deg, #3b82f6, #2563eb)";
      } else {
        confidenceBar.style.background = "linear-gradient(90deg, #f59e0b, #d97706)";
      }
    }

    if (alternativesList) {
      alternativesList.innerHTML = "";
      if (data.alternatives && data.alternatives.length > 0) {
        data.alternatives.forEach((alt) => {
          const row = document.createElement("div");
          row.className = "alternative-row";
          row.innerHTML = `
            <span>${escapeHtml(alt.team)}</span>
            <strong>${alt.confidence_percent}%</strong>
          `;
          alternativesList.appendChild(row);
        });
      } else {
        alternativesList.innerHTML = `<p style="color: var(--slate-400); font-size: 11px;">No alternate candidates</p>`;
      }
    }

    if (signalsList) {
      signalsList.innerHTML = "";
      if (data.signals && data.signals.length > 0) {
        data.signals.forEach((sig) => {
          const li = document.createElement("li");
          li.textContent = sig;
          signalsList.appendChild(li);
        });
      }
      if (data.text_terms_preview && data.text_terms_preview.length > 0) {
        const li = document.createElement("li");
        li.textContent = `Key terms detected: ${data.text_terms_preview.join(", ")}`;
        signalsList.appendChild(li);
      }
    }

    if (disclaimerEl && data.disclaimer) {
      disclaimerEl.textContent = data.disclaimer;
    }

    if (emptyState) emptyState.hidden = true;
    resultState.hidden = false;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});