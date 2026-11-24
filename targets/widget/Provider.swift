import WidgetKit

struct SnapshotEntry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot
  /// True when the app hasn't written data yet (show the "open the app" state).
  let isSample: Bool
}

/// One timeline entry at every event start/end in the next 24h (plus midnight),
/// so "next" and "progress" flip exactly on time without the app running.
struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> SnapshotEntry {
    SnapshotEntry(date: Date(), snapshot: .sample, isSample: true)
  }

  func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
    if let snapshot = Snapshot.load() {
      completion(SnapshotEntry(date: Date(), snapshot: snapshot, isSample: false))
    } else {
      completion(placeholder(in: context))
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
    let now = Date()
    guard let snapshot = Snapshot.load() else {
      let entry = SnapshotEntry(date: now, snapshot: .sample, isSample: true)
      completion(Timeline(entries: [entry], policy: .after(now.addingTimeInterval(3600))))
      return
    }

    let horizon = now.addingTimeInterval(24 * 3600)
    var dates: Set<Date> = [now]
    for item in snapshot.items {
      for d in [item.startDate, item.endDate] where d > now && d < horizon {
        dates.insert(d)
      }
    }
    if let midnight = Calendar.current.date(byAdding: .day, value: 1, to: Calendar.current.startOfDay(for: now)) {
      dates.insert(midnight)
    }

    let entries = dates.sorted().prefix(80).map {
      SnapshotEntry(date: $0, snapshot: snapshot, isSample: false)
    }
    // The app also reloads timelines whenever its data changes.
    completion(Timeline(entries: Array(entries), policy: .after(horizon)))
  }
}
